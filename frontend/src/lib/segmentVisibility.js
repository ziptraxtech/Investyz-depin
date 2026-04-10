export const HIDDEN_SEGMENT_IDS = ['renewable-energy', 'green-credits'];
export const FUTURE_SEGMENT_IDS = ['data-centers'];

export const isSegmentHidden = (segmentId) =>
  HIDDEN_SEGMENT_IDS.includes(String(segmentId || ''));

export const isSegmentFuture = (segmentId) =>
  FUTURE_SEGMENT_IDS.includes(String(segmentId || ''));

export const filterVisibleSegments = (segments) =>
  (Array.isArray(segments) ? segments : []).filter(
    (segment) => !isSegmentHidden(segment?.segment_id || segment?.id || segment?.slug)
  );

export const filterLiveSegments = (segments) =>
  filterVisibleSegments(segments).filter(
    (segment) => !isSegmentFuture(segment?.segment_id || segment?.id || segment?.slug)
  );
