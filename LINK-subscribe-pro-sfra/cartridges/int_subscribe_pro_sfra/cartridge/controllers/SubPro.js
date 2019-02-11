'use strict';

var server = require('server'),
    SubscribeProLib = require('*/cartridge/scripts/subpro/lib/SubscribeProLib'),
    ProductMgr = require('dw/catalog/ProductMgr'),
    URLUtils = require('dw/web/URLUtils'),
    BasketMgr = require('dw/order/BasketMgr');

const params = request.httpParameterMap;

server.get('PDP', function (req, res, next) {
    let response = SubscribeProLib.getProduct(params.sku.stringValue);

    if (response.error || !response.result.products.length) {
        return;
    }

    let spproduct = response.result.products.pop();

    // load full product from ProductMgr because the one in the productdetails.isml page
    // loaded by the product factory doesn't have all of the custom properties we need
    let product = ProductMgr.getProduct(params.sku.stringValue);
    if (params.selectedOptionMode.stringValue) {
        spproduct['selected_option_mode'] = params.selectedOptionMode.stringValue;
    } else {
        spproduct['selected_option_mode'] = (spproduct.subscription_option_mode === 'subscription_only' || spproduct.default_subscription_option === 'subscription') ? 'regular' : 'onetime';
    }

    if (params.selectedInterval.stringValue) {
        spproduct['selected_interval'] = params.selectedInterval.stringValue;
    } else {
        spproduct['selected_interval'] = spproduct.default_interval;
    }

    res.render('subpro/product/subprooptions', {
        subproduct: spproduct,
        sfccproduct: product,
        subprooptionsurl: URLUtils.url('SubPro-UpdateOptions').toString(),
        page: 'pdp'
    });
    next();
});

server.get('Cart', function(req, res, next) {
    let basket = BasketMgr.getCurrentOrNewBasket();
    let pli = basket.getAllProductLineItems(params.sku.stringValue).pop();

    if (!pli) {
        return;
    }

    let response = SubscribeProLib.getProduct(params.sku.stringValue);
    if (response.error || !response.result.products.length) {
        return;
    }

    let spproduct = response.result.products.pop();
    let sfccProduct = ProductMgr.getProduct(params.sku.stringValue);

    let productData = {
        "ID": pli.getProductID(),
        "subscription_option_mode": spproduct.subscription_option_mode,
        "selected_option_mode": pli.custom.subproSubscriptionSelectedOptionMode,
        "selected_interval": pli.custom.subproSubscriptionInterval,
        "intervals": spproduct.intervals.toString().split(','),
        "is_discount_percentage": pli.custom.subproSubscriptionIsDiscountPercentage,
        "discount": pli.custom.subproSubscriptionDiscount
    };
    res.render('subpro/product/subprooptions', {
        subproduct: productData,
        sfccproduct: sfccProduct,
        subprooptionsurl: URLUtils.url('SubPro-UpdateOptions').toString(),
        page: 'cart'
    });
    next();
});

server.get('OrderSummary', function (req, res, next) {
    let cart = app.getModel('Cart').get(),
        pli = cart.getProductLineItemByUUID(params.pliUUID.stringValue);

    if (!pli) {
        return;
    }

    let product = {
        "selected_option_mode": pli.custom.subproSubscriptionSelectedOptionMode,
        "selected_interval": pli.custom.subproSubscriptionInterval
    };

    res.render('subpro/order/subprooptions', {
        product: product,
        page: 'order-summary'
    });
    next();
});

server.get('OrderConfirmation', function (req, res, next) {
    let order = require('dw/order/OrderMgr').getOrder(params.orderNo.stringValue),
        productID = params.productID.stringValue;

    if (!order) {
        return;
    }

    let shipments = order.shipments;
    for (let i = 0, sl = shipments.length; i < sl; i++) {
        let plis = shipments[i].productLineItems;
        for (let j = 0, pl = plis.length; j < pl; j++) {
            let pli = plis[j];
            if (pli.productID === productID) {
                let product = {
                    "selected_option_mode": pli.custom.subproSubscriptionSelectedOptionMode,
                    "selected_interval": pli.custom.subproSubscriptionInterval
                };

                res.render('subpro/order/subprooptions', {
                    product: product,
                    page: 'order-confirmation'
                });
            }
        }
    }
    next();
});

server.post('UpdateOptions', function (req, res, next) {
    let basket = BasketMgr.getCurrentOrNewBasket(),
        CartModel = require('*/cartridge/models/cart');
    let pli = basket.getAllProductLineItems(params.pliUUID.stringValue).pop();
    if (!pli) {
        return;
    }

    require('dw/system/Transaction').wrap(function () {
        pli.custom.subproSubscriptionSelectedOptionMode = params.subscriptionMode;
        pli.custom.subproSubscriptionInterval = params.deliveryInteval;
        
        let discountValue = parseFloat(params.discount),
            discountToApply = params.isDiscountPercentage.getBooleanValue() === true
                ? new dw.campaign.PercentageDiscount(discountValue * 100)
                : new dw.campaign.AmountDiscount(discountValue);

        pli.custom.subproSubscriptionIsDiscountPercentage = params.isDiscountPercentage.getBooleanValue();
        pli.custom.subproSubscriptionDiscount = discountValue;

        /**
         * Remove previous 'SubscribeProDiscount' adjustments if any
         */
        let priceAdjustment = pli.getPriceAdjustmentByPromotionID('SubscribeProDiscount');
        pli.removePriceAdjustment(priceAdjustment);

        if (params.subscriptionMode.toString() === 'regular') {
            pli.createPriceAdjustment('SubscribeProDiscount', discountToApply);
        }

        res.json(new CartModel(basket));
    });
    return next();
});


module.exports = server.exports();