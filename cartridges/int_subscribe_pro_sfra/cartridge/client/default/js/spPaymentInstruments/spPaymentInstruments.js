"use strict";

module.exports = {
    afterRemovePayment: function () {
        $(document).on("payment:remove", function (e) {
            e.preventDefault();
            window.location.reload();
        });
    }
};
