// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const includingPickFromStore = input?.cart?.lines.some(
    (line) => line?.attribute?.key
  );

  const onlyPickUpfromStore = input?.cart?.lines.every(
    (line) => line?.attribute?.key
  );

  const message = "In-Store Pickup";

  let operations = [];

  // Extract delivery options from the cart's delivery groups
  const deliveryOptions = input?.cart?.deliveryGroups.flatMap(
    (group) => group?.deliveryOptions
  );

  // Modify delivery option titles if the In Store PickUp items present in the cart
  if (!onlyPickUpfromStore && includingPickFromStore) {
    operations = deliveryOptions.map((option) => {
      if (option?.title?.includes("In Store PickUp")) {
        return {
          hide: {
            deliveryOptionHandle: option?.handle,
          },
        };
      } else {
        return {
          rename: {
            deliveryOptionHandle: option?.handle,
            title: `${option.title} + ${message}`,
          },
        };
      }
    });
  }

  // Filter non "In Store PickUp" delivery options to hide them.
  else if (onlyPickUpfromStore) {
    operations = deliveryOptions
      .filter((option) => !option?.title?.includes("In Store PickUp"))
      .map((option) => {
        return {
          hide: {
            deliveryOptionHandle: option?.handle,
          },
        };
      });
  }

  // Filter and hide "In Store PickUp" delivery options
  else {
    operations = deliveryOptions
      .filter((option) => option?.title?.includes("In Store PickUp"))
      .map((option) => {
        return {
          hide: {
            deliveryOptionHandle: option?.handle,
          },
        };
      });
  }

  // Return operations if there are any operations available
  if (operations.length > 0) {
    return {
      operations,
    };
  }

  return NO_CHANGES;
}
