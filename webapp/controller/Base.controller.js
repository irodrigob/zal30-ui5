sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (
    Controller
) {
    "use strict";

    return Controller.extend("com.ivancio.zal30-ui5.controller.Base", {

        _mSections: {
            viewSelect: "viewSelect",
            viewData: "viewData"
        },

        //////////////////////////////////
        //                              //
        //        Public methods        //
        //                              //
        //////////////////////////////////
        onInit: function () {
            this._oOwnerComponent = this.getOwnerComponent();
            this._oAppDataModel = this._oOwnerComponent.getModel("appData");

        },
        // Navega a la rutina especificada con los parámetros indicados
        navRoute: function (sRoute, oParameters) {

            debugger;
            var oRouter = this._oOwnerComponent.getRouter();

            oRouter.navTo(sRoute, oParameters || {});
        },
        // Devuelve la info de una vista
        getViewInfo: function (sViewName) {

            // Se recuperan las vista que están en el modelo de datos
            var aViews = this._oAppDataModel.getProperty("/views");

            // Si no existe el find devuelve un "undefined"
            return aViews.find(view => view.VIEWNAME === sViewName)
        }

    });
});