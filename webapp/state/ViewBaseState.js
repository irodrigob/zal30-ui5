sap.ui.define([
	"sap/ui/base/Object",
	"com/ivancio/zal30-ui5/constants/constants"
], function (
	Object,
	constants
) {
	"use strict";

	return Object.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		constructor: function (oComponent) {
			Object.call(this);

			// Se inicializan las variables locales que son necesarias para acceder al modelo de datos
			this._oOwnerComponent = oComponent;
			this._oAppDataModel = this._oOwnerComponent.getModel("appData");
			this._oI18nResource = this._oOwnerComponent.getModel("i18n").getResourceBundle();
			
		}
	});
});
