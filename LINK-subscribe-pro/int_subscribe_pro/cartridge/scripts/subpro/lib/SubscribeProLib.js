importPackage( dw.svc );

/**
 * SubscribeProLib
 *
 * This library provides an interface to communicate with the Subscribe Pro REST API
 * Any API endpoints that need to be accessed, by some other logic in the application,
 * should be a added as a method in this object. Methods should be prefixed with the
 * relevant HTTP method (get / post)
 */
let SubscribeProLib = {
	/**
	 * Get a Web Service instance for the specified service name
	 */
	getService: function (serviceName) {
		return ServiceRegistry.get(serviceName);
	},

	/**
	 * Handle API Responses
	 * This method can be used to handle any API responses in a similar fashion.
	 * If there is not a result.object but an error message is present, we assume
	 * this is an error state and return a relevant response object, noting as such
	 */
	handleResponse: function(result) {
		let returnObject, hasError;

		if (!result.object && result.errorMessage) {
			let jsonObject;
			
			try {
				jsonObject = JSON.parse(result.errorMessage);
			} catch (e) {
				jsonObject = result.errorMessage;
			}
			
			return {
				error: true,
				result: jsonObject
			};
		} else {
			return {
				error: false,
				result: result.object
			};
		}

		return {};
	},

	/**
	 * Request the config object for this applications Subscribe Pro Account
	 * API Endpoint: GET /services/v2/config
	 *
	 * @return Object an object containing if this service returned an error and the results of the API request
	 */
	getConfig: function() {
		let service = SubscribeProLib.getService("subpro.http.get.config");
		return SubscribeProLib.handleResponse(service.call())
	},
	
	/**
	 * Request a list of subscriptions for the supplied customer id.
	 * If a customer id is not found, an error will be returned.
	 *
	 * API Endpoint: GET /services/v2/subscriptions
	 *
	 * @return Object an object containing whether or not this service returned an error and the results of the API request
	 */
	getSubscription: function (customerID) {
		if (!customerID) {
			return {
				error: true,
				result: "Customer ID is required for the getSubscription method"
			}
		}

		let service = SubscribeProLib.getService("subpro.http.get.subscriptions");

		return SubscribeProLib.handleResponse(service.call({customer_id: customerID}));
	},
	
	/**
	 * Update an Address
	 *
	 * API Endpoint: GET /services/v2/addresses/{id}
	 *
	 * @return Object an object containing whether or not this service returned an error and the results of the API request
	 */
	postUpdateAddress: function (addressID, address) {
		if (!addressID) {
			return {
				error: true,
				result: "Address ID is required for the postUpdateAddress method"
			}
		}

		let service = SubscribeProLib.getService("subpro.http.post.addresses");

		return SubscribeProLib.handleResponse(service.call({address_id: addressID, address: address}));
	},

	/**
	 * Get a single product by sku
	 *
	 * API Endpoint: GET /services/v2/products.{_format}
	 *
	 * @return Object an object containing whether or not this service returned an error and the results of the API request
	 */
	getProduct: function(sku) {
		if (!sku) {
			return {
				error: true,
				result: "sku is required for the getProduct method"
			}
		}

		let service = SubscribeProLib.getService("subpro.http.get.products");

		return SubscribeProLib.handleResponse(service.call({sku: sku}));
	}
};

module.exports = SubscribeProLib;
