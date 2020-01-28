sap.ui.define([
	"com/ivancio/zal30-ui5/model/BaseModel",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (BaseModel, JSONModel, merge, Filter, constants) {
	"use strict";

	return BaseModel.extend("com.ivancio.zal30-ui5.model.View", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////		  
		constructor: function (oComponent) {

			// Se llama a la clase padre pasandole los mismos parámetros
			BaseModel.call(this, oComponent);
		},
		// Guarda el catalogo de campos de la vista
		setFieldCatalog: function (mFieldCatalog) {
			this._fieldCatalog = mFieldCatalog;
		},
		// Devuelve el catalogo de campos
		getFieldCatalog: function () {
			return this._fieldCatalog;
		}
	});
});
