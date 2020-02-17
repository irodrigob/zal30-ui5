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

			// Inicialización del modelo interno
			this._initModel();
		},
		// Guarda el catalogo de campos de la vista. El catalogo se convierte para adaptarlo a la vista
		setFieldCatalogFromService: function (mFieldCatalog) {
			this._fieldCatalog = this._convertServiceFieldCatalog2Intern(mFieldCatalog);
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
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////		  
		// Inicialización de variables
		_initModel: function () {
			
			this._oViewData = '';
			this._oOriginalViewData = '';
			this._fieldCatalog = [];

		},
		// Se convierte el catalogo del servicio en el formato propio de la aplicación
		_convertServiceFieldCatalog2Intern: function (mFieldCatalog) {

			var aColumns = [];
			for (var x = 0; x < mFieldCatalog.length; x++) {
				var mColumn = {
					name: mFieldCatalog[x].FIELDNAME,
					shortText: mFieldCatalog[x].SHORTEXT,
					mediumText: mFieldCatalog[x].MEDIUMTEXT,
					longText: mFieldCatalog[x].LONGTEXT,
					headerText: mFieldCatalog[x].HEADERTEXT,
					mandatory: mFieldCatalog[x].MANDATORY,
					noOutput: mFieldCatalog[x].NOOUTPUT,
					checkBox: mFieldCatalog[x].CHECKBOX,
					keyDDIC: mFieldCatalog[x].KEYDDIC,
					edit: mFieldCatalog[x].EDIT,
					type: mFieldCatalog[x].TYPE,
					len: mFieldCatalog[x].LEN,
					decimals: mFieldCatalog[x].DECIMALS,
					lowerCase: mFieldCatalog[x].LOWERCASE
				};
				aColumns.push(mColumn);
			};
			return (aColumns);

		}
	});
});
