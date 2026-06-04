import type { RequestHandler } from "express";

export const apiHitLogger: RequestHandler = (request, _response, next) => {
  console.log(
    `API HIT --------------> ${request.method} ${request.originalUrl}   ${new Date().toLocaleString()}`
  );
  console.log("|");
  console.log("v");
  console.log("|");
  console.log('v');

  next();
};
