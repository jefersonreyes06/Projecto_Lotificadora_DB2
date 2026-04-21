export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const apiErrorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err?.message ?? "Internal server error" });
};