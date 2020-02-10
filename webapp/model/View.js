sap.ui.define([
	"com/ivancio/zal30-ui5/model/BaseModel",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (BaseModel, JSONModel, merge, Filter, constants) {
	"use strict";

	return BaseModel.extend("com.ivancio.zal30-ui5.model.View", {
		viewInfo: {
			viewName: "",
			viewDesc: ""
		},
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////		  
		constructor: function (oComponent) {

			// Se llama a la clase padre pasandole los mismos parámetros
			BaseModel.call(this, oComponent);
		},
		// Guarda el catalogo de campos de la vista
		setFieldCatalogFromService: function (mFieldCatalog) {
			this._fieldCatalog = mFieldCatalog;
		},
		// Devuelve el catalogo de campos
		getFieldCatalog: function () {
			return this._fieldCatalog;
		},
		// Guarda información general de la vista
		setViewInfo: function (mViewInfo) {
			// Se guarda el nombre de la vista y su descripción para usarse directamente sin tener que recuperar toda la info
			this.viewInfo.viewName = mViewInfo.VIEWNAME;
			this.viewInfo.viewDesc = mViewInfo.VIEWDESC;

			this._viewInfo = mViewInfo;
		},
		// Devuelve la información de la vista
		getViewInfo: function () {
			return this._viewInfo;
		},
		// Guarda los datos de la vista provenientes del servicio. Es decir, hay que convertir
		// el string json en un objeto JSON de UI5.
		setViewDataFromService: function (oData) {

			// Debido a que el JSON viene en un literal para poderlo usarla hay que parsearlo.					
			var oDataJSON = new sap.ui.model.json.JSONModel();
			oDataJSON.setJSON(oData);
			

			// Se recuperarán los datos parseado en un objeto JSON válido para poderse usar-
			this._oViewData = oDataJSON.getData();	
			this._oOriginalViewData = this._oViewData; // Se guarda los datos originales
			

		},
		// Devuelve los datos de la vista
		getViewData: function () {
			return this._oViewData;
		}
	});
});
