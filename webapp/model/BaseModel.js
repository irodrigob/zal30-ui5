sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"	
], function (Object, JSONModel, merge, Filter, constants) {
	"use strict";

	return Object.extend("com.ivancio.zal30-ui5.model.BaseModel", {

		//////////////////////////////////
		//                              //
		//        Public methods        //
		//                              //
		//////////////////////////////////
		constructor: function (oComponent) {

			// Se inicializan las variables locales que son necesarias para acceder al modelo de datos
			this._oOwnerComponent = oComponent;
			this._oAppDataModel = this._oOwnerComponent.getModel("appData");
			this._oI18nResource = this._oOwnerComponent.getModel("i18n").getResourceBundle();

			// Llamada al metodo padre
			Object.call(this);
		
		}


	});
});
