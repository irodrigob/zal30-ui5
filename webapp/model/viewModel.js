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
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			this._fieldCatalog = this._convertServiceFieldCatalog2Intern(mFieldCatalog);
			oViewDataModel.setProperty(constants.tableData.path.columns, this._convertServiceFieldCatalog2Intern(mFieldCatalog));
		},
		// Devuelve el catalogo de campos
		getFieldCatalog: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			return oViewDataModel.getProperty(constants.tableData.path.columns);
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
		setViewDataFromService: function (oDataGW) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Debido a que el JSON viene en un literal para poderlo usarla hay que parsearlo.								
			var oData = new sap.ui.model.json.JSONModel();
			oData.setJSON(oDataGW.DATA);
			oData = this._processAdapModelDataFromGW(oData);
			// Se guardado los valores en el modelo original
			oViewDataModel.setProperty(constants.tableData.path.values, oData.getData());

			// Se guarda los valores originales
			this._oOriginalViewData = new sap.ui.model.json.JSONModel();
			this._oOriginalViewData.setJSON(oDataGW.DATA);
			this._oOriginalViewData = this._processAdapModelDataFromGW(this._oOriginalViewData);

			// Se hace lo mismos pasos para los datos de template, pero estos no se guardan en el modelo de UI5 sino que se guardan como variable
			this._oDataTemplate = new sap.ui.model.json.JSONModel();
			this._oDataTemplate.setJSON(oDataGW.DATA_TEMPLATE);
			this._oDataTemplate = this._processAdapModelDataFromGW(this._oDataTemplate);		

		},
		// Devuelve los datos de la vista
		getViewData: function () {
			// Los datos se devuelve en formato plano para que puede ser usado en otros objetos, como la tabla de las vistas				
			return this._oViewData.getData();
		},
		// Devuelve la información de una columna del catalogo de campos
		getColumnInfo: function (sColumn) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			return mFielCatalog.find(columns => columns.name === sColumn);
		},
		// Formatea el valor en base al tipo de columna
		formatterValue: function (sColumn, oOldValue) {
			var mReturn = {
				newValue: oOldValue,
				formatted: false
			};


			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.char:

					if (mColumn.checkBox == true) {

					} else {

					}
					break;
				case constants.columnTtype.date:
					break;
				case constants.columnTtype.time:
					break;
				case constants.columnTtype.packed:
					// A los campos númericos se les quita las letras
					mReturn.newValue = mReturn.newValue.replace(/[^\d|.,]/g, '');
					mReturn.formatted = true; // Se indica que se ha aplicado formateo
					break;

			}

			return mReturn;
		},
		// Actualiza el valor de un campo en el modelo propio
		updateValueModel: function (sColumn, sPath, oValue) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se actualiza en el modelo
			oViewDataModel.setProperty(sPath + "/" + sColumn, oValue);

		},
		// Actualiza el indicador de actualización a nivel de línea
		setRowUpdateIndicator(sPath, sUpdkz) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se monta el path directo al campo que guarda el campo de actualización
			var sPathUpdkz = sPath + "/" + constants.tableData.internalFields.updkz;
			switch (sUpdkz) {
				case constants.tableData.fieldUpkzValues.update:
					// Se compará si el registro ha cambiado, en caso afirmativo se pone como que se ha actualizado
					if (this.compareRowDataFromOriginal(sPath))
						oViewDataModel.setProperty(sPathUpdkz, sUpdkz);
					break;
				case constants.tableData.fieldUpkzValues.delete:
				case constants.tableData.fieldUpkzValues.insert:
					oViewDataModel.setProperty(sPathUpdkz, sUpdkz);
					break;
			}
			/*
			// Se recupera la fila donde se ha hecho el cambio
			var mRow = this._oViewData.getProperty(sPath);

			// Si no hay indicador previo se informa el pasado
			if (mRow[constants.tableData.internalFields.updkz] == "") {
				mRow[constants.tableData.internalFields.updkz] = sUpdkz; //constants.tableData.fieldUpkzValues.update;
			}


			// Se actualiza en el modelo
			this._oViewData.setProperty(sPath, mRow);
*/
		},
		// Devuelve el número de campos clave. 		
		getNumberKeyFields: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			var nNumber = 0;

			for (var x = 0; x < this._fieldCatalog.length; x++) {
				// && !this._fieldCatalog[x].tech && !this._fieldCatalog[x].noOutput
				if (mFielCatalog[x].keyDDIC)
					nNumber = nNumber + 1;
			}
			return nNumber;
		},
		// Se modifica si a nivel de celda es posible editar el campo segun los valores y atributos
		detEditableCellValue: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			// Se recorren todos los campos del catalogo para poder acceder a cada campo de manera individual
			for (var x = 0; x < this._fieldCatalog.length; x++) {

				// Si el campo de edición existe se continua el proceso. El IF lo hago en dos pasos para que quede más claro su funcionamiento
				if (mRow[mFielCatalog[x].name + constants.tableData.suffix_edit_field]) {
					// Si el valor proviene del diccionario, es decir, que existe en base de datos y es un campo clave el campo se marca como no editable.
					if (mRow[constants.tableData.internalFields.isDict] == "X" && mFielCatalog[x].keyDDIC) {
						mRow[mFielCatalog[x].name + constants.tableData.suffix_edit_field] = false;
					}
				}
			}
			return mRow;
		},
		// Añade un registro vacia a los datos
		addEmptyRow: function () {

			// En el template solo habra un registro
			var mNewRow = this._oDataTemplate.getProperty("/0");

			// Se recupera el modelo
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// El nuevo registro se añadira al final, para ello tengo que saber el número total de registros
			var sPath = constants.tableData.path.values + "/" + oViewDataModel.oData.values.length;

			// Se añade el registro
			oViewDataModel.setProperty(sPath, mNewRow);

			// Se marca la fila con el indicador de actualización
			this.setRowUpdateIndicator(sPath, constants.tableData.fieldUpkzValues.insert);

		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////		  
		// Inicialización de variables
		_initModel: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			oViewDataModel.setProperty(constants.tableData.path.values, {});
			oViewDataModel.setProperty(constants.tableData.path.columns, {});
			this._oViewDataDeletd = new sap.ui.model.json.JSONModel();
			this._oOriginalViewData = '';


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
		_convValuesFromService: function (oData) {

			// Se recuperán los campos que son checkbox
			var acheckBoxFields = this._checkBoxFieldsinCatalog();

			// Si hay campos a tratar se inicial el proceso.	
			if (acheckBoxFields.length) {
				// Se recorren todos los registros leídos
				for (var x = 0; x < oData.oData.length; x++) {

					// Se recorre todos los campos de tipo checbox
					for (var y = 0; y < acheckBoxFields.length; y++) {
						// Se recupera el valor
						var sPath = "/" + x + "/" + acheckBoxFields[y].name;
						if (oData.getProperty(sPath) == 'X')
							oData.setProperty(sPath, true)
						else
							oData.setProperty(sPath, false)
					}
				}
			}
			return oData;

		},
		// Devuelve los campos que son checkbox
		_checkBoxFieldsinCatalog: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			return mFielCatalog.filter(field => field.checkBox == true)
		},
		// Añade campos de control al modelo de datos
		_addeditFields: function (oData) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se recorren los datos leídos
			for (var z = 0; z < oData.oData.length; z++) {
				for (var x = 0; x < mFielCatalog.length; x++) {
					// Los campos técnicos no tendrán campo de edición porque nunca se muestran
					if (!mFielCatalog[x].tech) {

						// se construye el nombre del nuevo campo que será el nombre del campo + un sufijo
						// constants.tableData.path.values +
						var sPathEditFieldname = "/" + z + "/" + mFielCatalog[x].name + constants.tableData.suffix_edit_field;
						oData.setProperty(sPathEditFieldname, mFielCatalog[x].edit);

					}
				}
			}
			return oData;
		},
		// Establece la edición inicial de las celdas según sus valores. 
		// Esta función solo se usará en la lectura inicial
		_setInitialEditCellValues: function (oData) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			// Se recorren los datos leídos
			for (var z = 0; z < oData.oData.length; z++) {
				// constants.tableData.path.values
				var sPath = "/" + z + "/"; // Path de acceso al modelo
				var sRow = oData.getProperty(sPath); // Recuperación del modelo
				// Se llama a la función encarga de determinar que celdas son editables
				sRow = this.detEditableCellValue(sRow);
				oData.setProperty(sPath, sRow); // Actualización del modelo

			}
			return oData;
		},
		// Compara una fila de datos con su valor original para ver si hay cambios
		compareRowDataFromOriginal(sPath) {

			debugger;

			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			var mRow = oViewDataModel.getProperty(sPath);
			var mOriginalRow = this._oOriginalViewData.getProperty(sPath);
		},
		// Proceso que adapta el modelo de datos que proviene de GW al modelo que se necesita en al aplicación
		_processAdapModelDataFromGW(oData) {
			// Se añaden los campos de control para poder determinar si un campo es editable o no.
			oData = this._addeditFields(oData);

			// Se establece a nivel de celda si el campo será editable o no
			oData = this._setInitialEditCellValues(oData);

			// Se adapta los valores según los tipos de campos pasados. Ejemplo: los campos checkbox que hay que cambiar la 'X'/'' por true/false.			
			oData = this._convValuesFromService(oData);

			return oData;
		}

	});
});
