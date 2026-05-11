import React, { useCallback, useEffect, useState } from 'react';
import { Filter, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import apiClient, { unwrap } from '../lib/apiClient';

const AdminKycPage = () => {
  const [status, setStatus] = useState('ALL');
  const [data, setData] = useState({ users: [], logs: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = status === 'ALL' ? '' : `?status=${status}`;
      setData(unwrap(await apiClient.get(`/api/kyc/admin${query}`)));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen pt-24 pb-14 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3">Admin</Badge>
            <h1 className="text-4xl font-semibold font-['Outfit']">KYC Monitor</h1>
            <p className="mt-2 text-muted-foreground">Review investor verification status, methods, timestamps, and audit logs.</p>
          </div>
          <div className="flex gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['ALL', 'NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'].map((item) => (
                  <SelectItem key={item} value={item}>{item.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load}>Refresh</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-['Outfit']">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell><Badge variant={user.kycStatus === 'VERIFIED' ? 'default' : 'outline'}>{user.kycStatus}</Badge></TableCell>
                      <TableCell>{user.kycMethod || '-'}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{user.verificationReferenceId || '-'}</TableCell>
                      <TableCell>{user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-['Outfit']">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.logs.slice(0, 10).map((log) => (
              <div key={log.log_id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{log.message || log.method}</span>
                  <Badge variant="outline">{log.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.user_id} · {log.reference_id || 'no reference'} · {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminKycPage;
