const fs = require('fs');
const path = require('path');
const { getPool } = require('../config/postgres');
const { encrypt } = require('../utils/crypto');
const { hashValue } = require('../utils/security');

let schemaEnsured = false;

const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'kyc-schema.sql'), 'utf8');

const ensureSchema = async () => {
  if (schemaEnsured) return;
  await getPool().query(schemaSql);
  schemaEnsured = true;
};

const mapUser = (row) => row ? {
  id: row.id,
  external_user_id: row.external_user_id,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  created_at: row.created_at,
  updated_at: row.updated_at,
} : null;

const mapKyc = (row) => row ? {
  id: row.id,
  user_id: row.user_id,
  pan_verified: row.pan_verified,
  pan_name: row.pan_name,
  pan_masked: row.pan_masked,
  pan_last4: row.pan_last4,
  pan_reference_id: row.pan_reference_id,
  digilocker_verified: row.digilocker_verified,
  digilocker_reference_id: row.digilocker_reference_id,
  digilocker_state: row.digilocker_state,
  digilocker_status: row.digilocker_status,
  digilocker_init_txn_id: row.digilocker_init_txn_id,
  digilocker_documents: row.digilocker_documents || [],
  digilocker_profile: row.digilocker_profile || {},
  kyc_status: row.kyc_status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  last_verified_at: row.last_verified_at,
} : null;

const syncUser = async ({ externalUserId, fullName, email, phone }) => {
  await ensureSchema();
  const result = await getPool().query(
    `insert into users (external_user_id, full_name, email, phone)
     values ($1, $2, $3, $4)
     on conflict (external_user_id)
     do update set
       full_name = excluded.full_name,
       email = excluded.email,
       phone = excluded.phone,
       updated_at = now()
     returning *`,
    [externalUserId, fullName, email, phone]
  );
  return mapUser(result.rows[0]);
};

const getUserWithKyc = async (externalUserId) => {
  await ensureSchema();
  const result = await getPool().query(
    `select
        u.*,
        k.id as kyc_id,
        k.pan_verified,
        k.pan_name,
        k.pan_masked,
        k.pan_last4,
        k.pan_reference_id,
        k.digilocker_verified,
        k.digilocker_reference_id,
        k.digilocker_state,
        k.digilocker_status,
        k.digilocker_init_txn_id,
        k.digilocker_documents,
        k.digilocker_profile,
        k.kyc_status,
        k.created_at as kyc_created_at,
        k.updated_at as kyc_updated_at,
        k.last_verified_at
     from users u
     left join investor_kyc k on k.user_id = u.id
     where u.external_user_id = $1`,
    [externalUserId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    user: mapUser(row),
    kyc: row.kyc_id ? {
      id: row.kyc_id,
      user_id: row.id,
      pan_verified: row.pan_verified,
      pan_name: row.pan_name,
      pan_masked: row.pan_masked,
      pan_last4: row.pan_last4,
      pan_reference_id: row.pan_reference_id,
      digilocker_verified: row.digilocker_verified,
      digilocker_reference_id: row.digilocker_reference_id,
      digilocker_state: row.digilocker_state,
      digilocker_status: row.digilocker_status,
      digilocker_init_txn_id: row.digilocker_init_txn_id,
      digilocker_documents: row.digilocker_documents || [],
      digilocker_profile: row.digilocker_profile || {},
      kyc_status: row.kyc_status,
      created_at: row.kyc_created_at,
      updated_at: row.kyc_updated_at,
      last_verified_at: row.last_verified_at,
    } : null,
  };
};

const upsertPanVerification = async ({
  userId,
  panNumber,
  panMasked,
  panName,
  panReferenceId,
  verified,
  status,
}) => {
  await ensureSchema();
  const panHash = hashValue(panNumber);
  const panLast4 = String(panNumber).slice(-4);
  const encryptedPan = encrypt(panNumber);

  const duplicateCheck = await getPool().query(
    `select user_id
     from investor_kyc
     where pan_hash = $1 and user_id <> $2
     limit 1`,
    [panHash, userId]
  );
  if (duplicateCheck.rows[0]) {
    const error = new Error('PAN already used for another investor profile');
    error.statusCode = 409;
    throw error;
  }

  const result = await getPool().query(
    `insert into investor_kyc (
        user_id,
        pan_number_encrypted,
        pan_hash,
        pan_masked,
        pan_last4,
        pan_verified,
        pan_name,
        pan_reference_id,
        kyc_status,
        created_at,
        updated_at,
        last_verified_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now(), case when $6 then now() else null end)
      on conflict (user_id)
      do update set
        pan_number_encrypted = excluded.pan_number_encrypted,
        pan_hash = excluded.pan_hash,
        pan_masked = excluded.pan_masked,
        pan_last4 = excluded.pan_last4,
        pan_verified = excluded.pan_verified,
        pan_name = excluded.pan_name,
        pan_reference_id = excluded.pan_reference_id,
        kyc_status = excluded.kyc_status,
        updated_at = now(),
        last_verified_at = case when excluded.pan_verified then now() else investor_kyc.last_verified_at end
      returning *`,
    [userId, encryptedPan, panHash, panMasked, panLast4, verified, panName, panReferenceId, status]
  );

  return mapKyc(result.rows[0]);
};

const upsertDigilockerSession = async ({
  userId,
  digilockerReferenceId,
  digilockerState,
  digilockerStatus,
  digilockerInitTxnId,
  accessToken,
  accessTokenExpiresAt,
  documents,
  profile,
  verified,
  kycStatus,
}) => {
  await ensureSchema();

  const encryptedToken = accessToken ? encrypt(accessToken) : null;
  const result = await getPool().query(
    `insert into investor_kyc (
        user_id,
        digilocker_reference_id,
        digilocker_state,
        digilocker_status,
        digilocker_init_txn_id,
        digilocker_access_token_encrypted,
        digilocker_access_token_expires_at,
        digilocker_documents,
        digilocker_profile,
        digilocker_verified,
        kyc_status,
        created_at,
        updated_at,
        last_verified_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, coalesce($8::jsonb, '[]'::jsonb), coalesce($9::jsonb, '{}'::jsonb), $10, $11, now(), now(), case when $10 then now() else null end)
      on conflict (user_id)
      do update set
        digilocker_reference_id = coalesce(excluded.digilocker_reference_id, investor_kyc.digilocker_reference_id),
        digilocker_state = coalesce(excluded.digilocker_state, investor_kyc.digilocker_state),
        digilocker_status = coalesce(excluded.digilocker_status, investor_kyc.digilocker_status),
        digilocker_init_txn_id = coalesce(excluded.digilocker_init_txn_id, investor_kyc.digilocker_init_txn_id),
        digilocker_access_token_encrypted = coalesce(excluded.digilocker_access_token_encrypted, investor_kyc.digilocker_access_token_encrypted),
        digilocker_access_token_expires_at = coalesce(excluded.digilocker_access_token_expires_at, investor_kyc.digilocker_access_token_expires_at),
        digilocker_documents = case when excluded.digilocker_documents = '[]'::jsonb then investor_kyc.digilocker_documents else excluded.digilocker_documents end,
        digilocker_profile = case when excluded.digilocker_profile = '{}'::jsonb then investor_kyc.digilocker_profile else excluded.digilocker_profile end,
        digilocker_verified = excluded.digilocker_verified,
        kyc_status = excluded.kyc_status,
        updated_at = now(),
        last_verified_at = case when excluded.digilocker_verified then now() else investor_kyc.last_verified_at end
      returning *`,
    [
      userId,
      digilockerReferenceId || null,
      digilockerState || null,
      digilockerStatus || null,
      digilockerInitTxnId || null,
      encryptedToken,
      accessTokenExpiresAt || null,
      documents ? JSON.stringify(documents) : null,
      profile ? JSON.stringify(profile) : null,
      Boolean(verified),
      kycStatus,
    ]
  );

  return mapKyc(result.rows[0]);
};

const getKycByState = async (state) => {
  await ensureSchema();
  const result = await getPool().query(
    `select k.*, u.external_user_id
     from investor_kyc k
     inner join users u on u.id = k.user_id
     where k.digilocker_state = $1
     limit 1`,
    [state]
  );
  return result.rows[0] ? {
    kyc: mapKyc(result.rows[0]),
    external_user_id: result.rows[0].external_user_id,
  } : null;
};

const getKycByReference = async (referenceId) => {
  await ensureSchema();
  const result = await getPool().query(
    `select k.*, u.external_user_id
     from investor_kyc k
     inner join users u on u.id = k.user_id
     where k.digilocker_reference_id = $1
        or k.digilocker_init_txn_id = $1
        or k.pan_reference_id = $1
     limit 1`,
    [referenceId]
  );
  return result.rows[0] ? {
    kyc: mapKyc(result.rows[0]),
    external_user_id: result.rows[0].external_user_id,
  } : null;
};

const insertVerificationLog = async ({
  userId = null,
  provider,
  apiType,
  requestId = null,
  responseStatus = null,
  httpStatus = null,
  direction = 'outbound',
  eventType = null,
  callbackTransactionId = null,
  metadata = {},
}) => {
  await ensureSchema();
  const result = await getPool().query(
    `insert into verification_logs (
       user_id,
       provider,
       api_type,
       request_id,
       response_status,
       http_status,
       direction,
       event_type,
       callback_transaction_id,
       metadata
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
     on conflict (callback_transaction_id)
     do nothing
     returning *`,
    [
      userId,
      provider,
      apiType,
      requestId,
      responseStatus,
      httpStatus,
      direction,
      eventType,
      callbackTransactionId,
      JSON.stringify(metadata || {}),
    ]
  );
  return result.rows[0] || null;
};

const listVerificationLogs = async (userId, limit = 10) => {
  await ensureSchema();
  const result = await getPool().query(
    `select *
     from verification_logs
     where user_id = $1
     order by created_at desc
     limit $2`,
    [userId, limit]
  );
  return result.rows;
};

const listAdminKycRecords = async ({ status = null, limit = 100 } = {}) => {
  await ensureSchema();
  const values = [limit];
  let whereClause = '';

  if (status) {
    values.unshift(status);
    whereClause = 'where coalesce(k.kyc_status, $1) = $1';
  }

  const limitPlaceholder = status ? '$2' : '$1';
  const result = await getPool().query(
    `select
       u.id,
       u.external_user_id,
       u.full_name,
       u.email,
       u.phone,
       u.created_at,
       u.updated_at,
       k.pan_verified,
       k.pan_name,
       k.pan_masked,
       k.pan_reference_id,
       k.digilocker_verified,
       k.digilocker_reference_id,
       k.digilocker_status,
       k.kyc_status,
       k.last_verified_at
     from users u
     left join investor_kyc k on k.user_id = u.id
     ${whereClause}
     order by coalesce(k.updated_at, u.updated_at) desc
     limit ${limitPlaceholder}`,
    values
  );

  return result.rows.map((row) => ({
    user_id: row.external_user_id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    pan_verified: row.pan_verified,
    pan_name: row.pan_name,
    pan_masked: row.pan_masked,
    pan_reference_id: row.pan_reference_id,
    digilocker_verified: row.digilocker_verified,
    digilocker_reference_id: row.digilocker_reference_id,
    digilocker_status: row.digilocker_status,
    kycStatus: row.kyc_status || 'NOT_STARTED',
    kycMethod: row.digilocker_verified ? 'DIGILOCKER' : row.pan_verified ? 'PAN' : null,
    verificationReferenceId: row.digilocker_reference_id || row.pan_reference_id || null,
    kycSubmittedAt: row.last_verified_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

const listRecentVerificationLogs = async (limit = 100) => {
  await ensureSchema();
  const result = await getPool().query(
    `select l.*, u.external_user_id
     from verification_logs l
     left join users u on u.id = l.user_id
     order by l.created_at desc
     limit $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.external_user_id,
    provider: row.provider,
    api_type: row.api_type,
    request_id: row.request_id,
    response_status: row.response_status,
    http_status: row.http_status,
    direction: row.direction,
    event_type: row.event_type,
    callback_transaction_id: row.callback_transaction_id,
    metadata: row.metadata || {},
    created_at: row.created_at,
    message: row.metadata?.message || `${row.provider} ${row.api_type}`,
    status: row.response_status || 'PENDING',
    reference_id: row.request_id || row.callback_transaction_id,
  }));
};

module.exports = {
  ensureSchema,
  getKycByReference,
  getKycByState,
  getUserWithKyc,
  insertVerificationLog,
  listAdminKycRecords,
  listRecentVerificationLogs,
  listVerificationLogs,
  syncUser,
  upsertDigilockerSession,
  upsertPanVerification,
};
