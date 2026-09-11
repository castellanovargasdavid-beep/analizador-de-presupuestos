export class MissingPricingDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingPricingDataError";
  }
}

export class InvalidEstimationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEstimationInputError";
  }
}
