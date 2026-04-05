import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and add withCredentials: true
  const authReq = req.clone({
    withCredentials: true
  });

  // Pass the cloned request instead of the original request to the next handler
  return next(authReq);
};
