import {
  reactExtension,
  BlockStack,
  TextBlock,
  useApplyShippingAddressChange,
  useCartLines,
  Heading,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const applyShippingAddressChange = useApplyShippingAddressChange();
  const cartLine = useCartLines();
  const storeId = "_pickupstore";
  const addressKey = "Pickup Store";

  /**
   * Converts a list of store codes into a filter string for API queries.
   *
   * @param {Array} storeCodes - List of store codes.
   * @return {String} Filter string for the API query.
   */
  function convertListToFilterString(storeCodes) {
    if (!Array.isArray(storeCodes) || storeCodes.length === 0) {
      return `storeCode: ()`;
    }

    const formattedValues = storeCodes.join(" OR ");
    return `storeCode: (${formattedValues})`;
  }

  /**
   * Fetches the full addresses of stores based on the provided store codes.
   *
   * @param {Array} storeCodes - List of store codes.
   * @return {Array} List of store addresses.
   */
  async function getPickupStores(storeCodes) {
    const url = "https://dev-oms.hotwax.io/api/storeLookup";
    const payload = {
      viewSize: 100,
      filters: [
        "storeType: RETAIL_STORE",
        convertListToFilterString(storeCodes),
      ],
    };

    try {
      const result = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await result.json();
      if (data?.response) {
        return data?.response?.docs;
      }
      throw new Error(`Store locations not found.`);
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /**
   * Returns a unique list of stores by removing duplicates.
   *
   * @param {Array} storeData - Raw store data.
   * @return {Array} Unique list of stores.
   */
  const getUniqueStores = (storeData) => {
    return [...new Set(storeData.map(JSON.stringify))].map(JSON.parse);
  };

  // Setting delivery address to checkout
  const setDeliveryAddress = (deliveryAddress) => {
    const {
      countryCode,
      address1,
      city,
      postalCode: zip,
      stateCode,
    } = deliveryAddress;

    const newShippingAddress = {
      type: "updateShippingAddress",
      address: {
        countryCode,
        address1,
        city,
        zip,
        provinceCode: stateCode,
      },
    };
    applyShippingAddressChange(newShippingAddress).then((result) => {
      console.log(result);
    });
  };

  const stores = cartLine.filter((line) => line?.attributes?.length > 0);

  const storeCodeData = getUniqueStores(
    stores.map((line) =>
      (line?.attributes ?? []).find((attr) => attr?.key === storeId)
    )
  );

  // Getting store Addresses
  const storeAddresses = getUniqueStores(
    stores.map((line) =>
      (line?.attributes ?? []).find((attr) => attr?.key === addressKey)
    )
  );
  const storeCodes = storeCodeData.map((store) => store?.value);

  useEffect(() => {
    if (storeCodes.length > 0) {
      getPickupStores(storeCodes).then((res) => {
        setDeliveryAddress((res ?? [])[0]);
      });
    }
  }, []);

  // Render a UI
  return (
    <>
      {storeAddresses.length > 0 && (
        <BlockStack>
          <Heading>Selected Pickup Stores</Heading>
          {storeAddresses.map((store) => (
            <TextBlock key={store?.key + store?.value}>
              {store && store?.value}
            </TextBlock>
          ))}
        </BlockStack>
      )}
    </>
  );
}
