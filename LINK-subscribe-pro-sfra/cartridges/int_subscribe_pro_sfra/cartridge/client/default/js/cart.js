'use strict';

var processInclude = require('../../../../../app_storefront_base/cartridge/client/default/js/util');

$(document).ready(function () {
    processInclude(require('../../../../../app_storefront_base/cartridge/client/default/js/cart/cart'));
    processInclude(require('./subscriptionOptions'));
});
