sap.ui.define([
    "com/ivancio/zal30-ui5/controller/Base.controller"
], function (BaseController) {
    "use strict";

    return BaseController.extend("com.ivancio.zal30-ui5.controller.ViewData", {

        //////////////////////////////////
        //                              //
        //        Public methods        //
        //                              //
        //////////////////////////////////
        onInit: function () {
            this._oOwnerComponent = this.getOwnerComponent();
            this._oAppDataModel = this._oOwnerComponent.getModel("appData");
            this._oI18nResource = this._oOwnerComponent.getModel("i18n").getResourceBundle();
            this._initModel(); // Llamada al método 
            // para la página actual del router se le indica que llame al método _onRouteMatched de la propia clase. Esto hará que cada
            // vez que se entre al detalle se llamará a dicho método
            this._oOwnerComponent.getRouter().getRoute(this._mSections.viewData).attachPatternMatched(this._onRouteMatched, this);
        },
        //////////////////////////////////
        //                              //
        //        Private methods       //
        //                              //
        //////////////////////////////////
        // Método que entra cuando se hace a la página desde la routing
        _onRouteMatched: function (oEvent) {

            debugger;

            // Se recupera el nombre de la vista
            var sViewName = oEvent.getParameter("arguments").view;

            // Se guarda en el modelo
            this._oViewDataModel.setProperty("/viewName", sViewName);

            // Se recupera los datos de la vista para saber la descripcion
            var mViewInfo = this.getViewInfo(sViewName);
            if (mViewInfo){

                this._oViewDataModel.setProperty("/viewDesc", mViewInfo.VIEWDESC);

            }
            else
            {
                // Si la vista no es valida se vuelve a la selección de vistas
                this.navRoute(this._mSections.viewSelect);                
            }


        },
        _initModel: function () {
            this._oViewDataModel = new sap.ui.model.json.JSONModel();
            this._oViewDataModel.setData({              
              viewName: '',
              viewDesc:''
            });
      
            this.getView().setModel(this._oViewSelectModel, "ViewDataModel");
        }
    });
});