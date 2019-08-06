"use strict";

var server = require("server");
var URLUtils = require("dw/web/URLUtils");
var Resource = require("dw/web/Resource");

var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");

if (require("dw/system/Site").getCurrent().getCustomPreferenceValue("subproEnabled")) {
    server.get("List", userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
        res.render("subpro/account/mysubscriptions");
        next();
    });
}

module.exports = server.exports();
