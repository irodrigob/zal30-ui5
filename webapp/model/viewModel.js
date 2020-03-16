sap.ui.define([
	"com/ivancio/zal30-ui5/model/BaseModel",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants"
], function (BaseModel, JSONModel, merge, Filter, constants) {
	"use strict";

	return BaseModel.extend("com.ivancio.zal30-ui5.model.viewModel", {
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
			this._oViewData.setJSON(oData);

			// Se adapta los valores según los tipos de campos pasados. Ejemplo: los campos checkbox que hay que cambiar la 'X'/'' por true/false.
			this._oViewData = this._convValuesFromService(this._oViewData);

			// Se guarda el valor original
			this._oOriginalViewData = this._oViewData;


		},
		// Devuelve los datos de la vista
		getViewData: function () {
			// Los datos se devuelve en formato plano para que puede ser usado en otros objetos, como la tabla de las vistas	
			return this._oViewData.getData();
		},
		// Devuelve la información de una columna del catalogo de campos
		getColumnInfo: function (sColumn) {
			return this._fieldCatalog.find(columns => columns.name === sColumn);
		},
		// Formatea el valor en base al tipo de columna
		formatterValue: function (sColumn, oOldValue) {

			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.char:

					if (mColumn.checkBox == true) {

					} else {

					}
					return sOldValue;
					break;
				case constants.columnTtype.date:
					return sOldValue;
					break;
				case constants.columnTtype.time:
					return sOldValue;
					break;
				case constants.columnTtype.packed:
					// A los campos númericos se les quita las letras
					return oOldValue.replace(/[^\d|.,]/g, '');
					break;

			}


		},
		// Actualiza el valor de un campo en el modelo propio
		updateValueModel: function (sColumn, sPath, oValue) {
			// Se recupera la fila donde esta el valor a modificar
			var mRow = this._oViewData.getProperty(sPath);

			// Se actualiza el nuevo valor
			mRow[sColumn] = oValue;

			// Se actualiza en el modelo
			this._oViewData.setProperty(sPath, mRow);

		},
		// Devuelve el número de campos clave. 		
		getnumberKeyFields: function () {
			var nNumber = 0;

			for (var x = 0; x < this._fieldCatalog.length; x++) {				
				// && !this._fieldCatalog[x].tech && !this._fieldCatalog[x].noOutput
				if (this._fieldCatalog[x].keyDDIC)
					nNumber = nNumber + 1;
			}
			return nNumber;
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////		  
		// Inicialización de variables
		_initModel: function () {

			this._oViewData = new sap.ui.model.json.JSONModel();
			this._oViewDataDeletd = new sap.ui.model.json.JSONModel();
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
					lowerCase: mFieldCatalog[x].LOWERCASE,
					tech: mFieldCatalog[x].TECH
				};
				aColumns.push(mColumn);
			};
			return (aColumns);

		},
		// Conversion de los datos procedentes del servicios
		_convValuesFromService: function (oDataJSON) {

			// Se recuperán los campos que son checkbox
			var acheckBoxFields = this._checkBoxFieldsinCatalog();

			// Si hay campos a tratar se inicial el proceso.	
			if (acheckBoxFields.length) {
				// Se recorren todos los registros leídos
				for (var x = 0; x < oDataJSON.oData.length; x++) {

					// Se recorre todos los campos de tipo checbox
					for (var y = 0; y < acheckBoxFields.length; y++) {
						// Se recupera el valor
						var sPath = "/" + x + "/" + acheckBoxFields[y].name;
						if (oDataJSON.getProperty(sPath) == 'X')
							oDataJSON.setProperty(sPath, true)
						else
							oDataJSON.setProperty(sPath, false)


					}


				}
			}
			return oDataJSON;


		},
		// Devuelve los campos que son checkbox
		_checkBoxFieldsinCatalog: function () {
			return this._fieldCatalog.filter(field => field.checkBox == true)
		}
	});
});
