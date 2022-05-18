(function () {
    let jQueryBopis;
    let $location;

    // defining a global object having properties which let merchant configure some behavior
    this.bopisCustomConfig = {
        'enableCartRedirection': true
    };

    // TODO Generate instance specific code URL in FTL. Used with <#noparse> after this code so that `` code is escaped
    // let baseUrl = '<@ofbizUrl secure="true"></@ofbizUrl>';
    let baseUrl = '';

    let loadScript = function(url, callback){

        let script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState){ 
            script.onreadystatechange = function(){
                if (script.readyState == "loaded" || script.readyState == "complete"){
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            script.onload = function(){
                callback();
            };
        }
    
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
        
    };

    // adding css in the current page
    let style = document.createElement("link");
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = `${baseUrl}/api/shopify-bopis.min.css`;

    document.getElementsByTagName("head")[0].appendChild(style);

    if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn['jquery']) < 1.7)) {
        loadScript('//ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js', function(){
            jQueryBopis = jQuery.noConflict(true);
            jQueryBopis(document).ready(function() {
                initialiseBopis();
            });

        });
    } else {
        jQueryBopis = jQuery;
        jQuery(document).ready(function() {
            initialiseBopis();
        });
    }

    // function to get co-ordinates of the user after successfully getting the location
    function locationSuccess (pos) {
        $location = pos.coords;
    }

    // function to display error on console if having any error when getting the location
    function locationError (err) {
        console.error(err.code, err.message);
    }

    // will fetch the current location of the user
    function getCurrentLocation () {
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
    }

    // defined method to check whether product is preorder or backorder
    function isItemAvailableForOrder () {
        return new Promise(function(resolve, reject) {
            jQueryBopis.getJSON(`${window.location.pathname}.js`, function (data){
                if (data.tags.includes('Pre-Order') || data.tags.includes('Back-Order')) {
                    resolve(data)
                }
                reject(false)
            })
        })
    }

    async function initialiseBopis () {
        if (location.pathname.includes('products')) {

            await getCurrentLocation();

            jQueryBopis(".hc-open-bopis-modal").remove();

            // TODO Simplify this [name='id']. There is no need to serialize
            const cartForm = jQueryBopis("form[action='/cart/add']");

            const response = await handleAddToCartEvent();
            if (response.length <= 0 || response.includes('error')) return;

            // Assigning response[0] to store as in this case we are having a single store
            const store = response[0];
            let $btn = jQueryBopis('<button class="btn btn--secondary-accent hc-open-bopis-modal">Pick Up Today</button>');
            cartForm.append($btn);
            $btn.on('click', updateCart.bind(null, store));

        } else if(location.pathname.includes('cart')) {
            // finding this property on cart page as some themes may display hidden properties on cart page
            jQueryBopis("[data-cart-item-property-name]:contains('pickupstore')").closest('li').hide();
        }
    }

    function getStoreInformation () {
        // defined the distance to find the stores in this much radius area
        // viewSize is used to define the number of stores to fetch
        const payload = {
            viewSize: 20
        }

        if ($location) {
            payload["distance"] = 50
            payload["point"] = `${$location.latitude}, ${$location.longitude}`
        }

        // applied a condition that if we have location permission then searching the stores for the current location
        // if we have both location and pin, then using the pin to search for stores
        // if we doesn't have location permission and pin, then will fetch all the available stores
        return new Promise(function(resolve, reject) {
            jQueryBopis.ajax({
                type: 'POST',
                url: `${baseUrl}/api/storeLookup`,
                crossDomain: true,
                data: JSON.stringify(payload),
                success: function (res) {
                    resolve(res)
                },
                error: function (err, textStatus) {
                    reject(textStatus);
                }
            })
        })
    }

    async function checkInventory(payload) {

        // this will create a url param like &facilityId=store_1&facilityId=store_1 which is then sent
        // with the url, used this approach as unable to send array in the url params and also unable to
        // pass body as the request type is GET.
        let paramFacilityId = '';
        payload[0].facilityId.map((facility) => {
            paramFacilityId += `&facilityId=${facility}`
        })

        let resp;

        // added try catch to handle network related errors
        try {
            resp = await new Promise(function(resolve, reject) {
                jQueryBopis.ajax({
                    type: 'GET',
                    url: `${baseUrl}/api/checkInventory?sku=${payload[0].sku}${paramFacilityId}`,
                    crossDomain: true,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (xhr, textStatus, exception) {
                        reject(textStatus)
                    }
                })
            })
        } catch (err) {
            resp = err;
        }
        return resp;
    }
    
    async function handleAddToCartEvent(event) {

        let eventTarget;
        if (event) {
            eventTarget = jQueryBopis(event.target);
            // to stop event bubbling when clicking on the Check Stores button
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        let storeInformation = await getStoreInformation().then(data => data).catch(err => err);
        let result = '';

        const id = jQueryBopis("form[action='/cart/add']").serializeArray().find(ele => ele.name === "id").value
        const sku = meta.product.variants.find(variant => variant.id == id).sku

        if (event) eventTarget.prop("disabled", true);

        // checking if the number of stores is greater then 0 then creating a payload to check inventory
        if (storeInformation && storeInformation.response && storeInformation.response.numFound > 0) {

            let storeCodes = storeInformation.response.docs.map((store) => {
                let storeCode = '';

                // if storeCode starts with DC_ then removing the code
                if (store.storeCode.startsWith('DC_')) {
                    storeCode = store.storeCode.substring(3);
                } else {
                    storeCode = store.storeCode;
                }

                store.storeCode = storeCode;
                return storeCode;
            })

            // passing the facilityId as an array in the payload
            let payload = [{"sku" : sku, "facilityId": storeCodes}];
            result = await checkInventory(payload)

            // mapping the inventory result with the locations to filter those stores whose inventory
            // is present and the store code is present in the locations.
            if (result.docs && result.count > 0) {
                result = storeInformation.response.docs.filter((location) => {
                    return result.docs.some((doc) => {
                        return doc.facilityId === location.storeCode && doc.atp > 0;
                    })
                })
            }
        }

        // displayStoreInformation(result)
        if (event) eventTarget.prop("disabled", false);

        return result;
    }
    
    // will add product to cart with a custom property pickupstore
    async function updateCart(store, event) {

        event.preventDefault();
        event.stopImmediatePropagation();

        let addToCartForm = jQueryBopis("form[action='/cart/add']");
        let productType = '';

        const id = addToCartForm.serializeArray().find(ele => ele.name === "id").value
        let checkItemAvailablity = await isItemAvailableForOrder().then((product) => {
            // checking what type of tag product contains (Pre-Order / Back-order) and on the basis of that will check for metafield
            productType = product.tags.includes('Pre-Order') ? 'Pre-Order' : product.tags.includes('Back-Order') ? 'Back-Order' : ''

            // checking if continue selling is enabled for the variant or not
            return product.variants.find((variant) => variant.id == id).available
        }).catch(err => err);

        if (jQueryBopis("input[class='hc_inventory']").val() > 0) checkItemAvailablity = false;

        // if the product does not contains specific tag and continue selling is not enabled then not executing the script
        if (!checkItemAvailablity) productType = '';
                
        // let merchant define the behavior whenever pick up button is clicked, merchant can define an event listener for this event
        jQueryBopis(document).trigger('prePickUp');

        // made the property hidden by adding underscore before the property name
        let facilityIdInput = jQueryBopis(`<input id="hc-store-code" name="properties[_pickupstore]" value=${store.storeCode ? store.storeCode : ''} type="hidden"/>`)
        addToCartForm.append(facilityIdInput)

        let facilityNameInput = jQueryBopis(`<input id="hc-pickupstore-address" name="properties[Pickup Store]" value="${store.storeName ? store.storeName : ''}, ${store.address1 ? store.address1 : ''}, ${store.city ? store.city : ''}" type="hidden"/>`)
        addToCartForm.append(facilityNameInput)

        let productTypeInput = jQueryBopis(`<input id="hc-order-item" name="properties[Note]" value="${productType}" type="hidden"/>`)
        if (productType) {
            addToCartForm.append(productTypeInput)
        }

        // using the cart add endpoint to add the product to cart, as using the theme specific methods is not recommended.
        jQueryBopis.ajax({
            type: "POST",
            url: '/cart/add.js',
            data: addToCartForm.serialize(),
            dataType: 'JSON',
            success: function () {

                // let merchant define the behavior after the item is successfully added as a pick up item, merchant can define an event listener for this event
                jQueryBopis(document).trigger('postPickUp');

                // redirecting the user to the cart page after the product gets added to the cart
                if (bopisCustomConfig.enableCartRedirection) {
                    location.replace('/cart');
                }
            }
        })

        facilityIdInput.remove();
        facilityNameInput.remove();
        productTypeInput.remove();
    }
    // TODO move it to intialise block
    // To check whether the url has changed or not, for making sure that the variant is changed.
    let url = location.href; 
    new MutationObserver(() => {
        if (location.href !== url) {
            url = location.href;
            initialiseBopis();
        }
        // added condition to run the script again as when removing a product the script does not run
        // and thus the store id again becomes visible
        if (location.pathname.includes('cart')) initialiseBopis();
    }).observe(document, {subtree: true, childList: true});

})();