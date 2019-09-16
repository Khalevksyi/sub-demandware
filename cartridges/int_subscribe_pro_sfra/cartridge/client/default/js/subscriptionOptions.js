'use strict';

/* eslint no-undef: 0, no-unused-vars: 0 */

/**
 * Toggle the dropdown list of delivery intervals
 * @param {Event} event The event data
 * @param {string} $deliveryInterval The delivery interval element
 */
function toggleDeliveryIntervalDropdown(event, $deliveryInterval) {
    var hideDropdown = $(event.currentTarget).val() !== 'regular';
    $deliveryInterval.attr('hidden', hideDropdown);
}

/**
 * Serialize the URL parameters
 * @param {Object} obj URL object
 * @param {string} prefix Prefix
 * @return {string} The serialized parameters
 */
function serializeURLParams(obj, prefix) {
    var str = [];
    var p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            var k = prefix ? prefix + '[' + p + ']' : p;
            var v = obj[p];
            str.push((v !== null && typeof v === 'object')
                ? serialize(v, k)
                : encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
    }
    return str.join('&');
}

var subscriptionOptions = {
    cartInit: function () {
        if (!$('body').find('.subpro-options.cart').length) {
            return;
        }
        // remove on click handler for delete. it gets added back again when cart/cart.js is
        // added in the base cart.js client script.
        $('body').off('click', '.cart-delete-confirmation-btn');

        $('.subpro-options.cart input[name^=subproSubscriptionOptionMode]')
            .off('change')
            .on('change', function (event) {
                $(event.currentTarget).parents('.card').spinner().start();
                toggleDeliveryIntervalDropdown(event, $('.subpro-options.cart .delivery-interval-group'));
                $('body').trigger('cartOptionsUpdate', { event: event, page: 'cart' });
                // page is reloaded upon success in AJAX ajaxUpdateOptions
            });

        $('.subpro-options.cart #delivery-interval')
            .off('change')
            .on('change', function (event) {
                $(event.currentTarget).parents('.card').spinner().start();
                $('body').trigger('cartOptionsUpdate', { event: event, page: 'cart' });
                // page is reloaded upon success in AJAX ajaxUpdateOptions
            });
    },

    variantInit: function () {
        if (!$('body').find('.subpro-options.pdp').length) {
            return;
        }
        var options = $('.subpro-options.pdp input[name^=subproSubscriptionOptionMode]:checked');
        for (var i = 0; i < options.length; i++) {
            var option = $(options[i]);
            option.parent().parent().find('.delivery-interval-group').attr('hidden', option.val() !== 'regular');
        }

        $('.subpro-options.pdp input[name^=subproSubscriptionOptionMode]')
            .off('change')
            .on('change', function (event) {
                toggleDeliveryIntervalDropdown(event, $(event.currentTarget).parent().parent().find('.delivery-interval-group'));
                $('body').trigger('pdpOptionsUpdate', { event: event, page: 'pdp' });
            });

        $('.subpro-options.pdp #delivery-interval')
            .off('change')
            .on('change', function (event) {
                $('body').trigger('pdpOptionsUpdate', { event: event, page: 'pdp' });
            });
    },

    getOptionsState: function (target, page) {
        var parent;
        var pliUUID;

        if (page !== 'pdp' && page !== 'cart') {
            return;
        }
        parent = target.closest('.subpro-options.' + page);

        if (page === 'pdp') {
            pliUUID = parent.find('input[name=subproSubscriptionProductId]').val();
        } else {
            pliUUID = parent.closest('.product-info').find('button.remove-product').data('pid');
        }

        return {
            pliUUID: pliUUID,
            subscriptionMode: parent.find('input[name^=subproSubscriptionOptionMode]:checked').val(),
            deliveryInteval: parent.find('#delivery-interval').val(),
            discount: parent.find('input[name=subproSubscriptionDiscount]').val(),
            isDiscountPercentage: parent.find('input[name=subproSubscriptionIsDiscountPercentage]').val()
        };
    },

    handleAddToCartSubOptions: function () {
        $(document).on('updateAddToCartFormData', function (e, data) {
            var subOptions = subscriptionOptions.getOptionsState($(document).find('div.subpro-options.pdp'), 'pdp');
            data.pliUUID = subOptions.pliUUID;
            data.subscriptionMode = subOptions.subscriptionMode;
            data.deliveryInteval = subOptions.deliveryInteval;
            data.discount = subOptions.discount;
            data.isDiscountPercentage = subOptions.isDiscountPercentage;
        });
    },

    ajaxUpdateOptions: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            $('input[name=subproSubscriptionProductId]').val(response.data.product.id);
        });

        $(document).on('pdpOptionsUpdate cartOptionsUpdate', function (e, p) {
            ajaxUpdateOptions($(p.event.currentTarget), p.page); // eslint-disable-line
        });

        $(document).on('product:afterAddToCart', function (e, data) {
            ajaxUpdateOptions($(document).find('div.subpro-options.pdp'), 'pdp'); // eslint-disable-line
        });
    }
};

/**
 * Update subscription options via AJAX when they are changed
 * @param {string} target DOM target we can use for getting the option state
 * @param {string} page The current page (pdp or cart)
 */
function ajaxUpdateOptions(target, page) {
    var data = subscriptionOptions.getOptionsState(target, page);
    var queryString = serializeURLParams(data);
    $.ajax({
        type: 'POST',
        cache: false,
        contentType: 'application/json',
        url: $('input[name=subproSubscriptionOptionsUrl]').val() + '?' + queryString,
        success: function () {
            if (page == 'cart') {
                window.location.reload(true);
            }
        }
    });
}

module.exports = subscriptionOptions;
