import {
  reactExtension,
  Banner,
  Text,
  useSettings,
  useCartLines,
  useApi
} from "@shopify/ui-extensions-react/checkout";

// extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { banner_title, banner_message, banner_status } = useSettings();
  const cartLine = useCartLines();
  const api = useApi()

  const mixedProducts = cartLine.some(
    (line) => (line?.attributes ?? []).length > 0
  );

  const onlyPickUpFromStore = cartLine.every(
    (line) => (line?.attributes ?? []).length > 0
  );

  const isAdmin = api?.extension?.editor

  // Render a UI
  return (
    <>
      {(mixedProducts || onlyPickUpFromStore || isAdmin) && (banner_title || banner_message) && (
        <Banner title={banner_title ?? ""} status={banner_status ?? "info"}>
          {banner_message && <Text>{banner_message}</Text>}
        </Banner>
      )}
    </>
  );
}