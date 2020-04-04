sap.ui.define([
	"com/ivancio/zal30-ui5/model/BaseModel",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants",
	"com/ivancio/zal30-ui5/component/helper/formatters"
], function (BaseModel, JSONModel, merge, Filter, constants, formatters) {
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

			// Se instancia la clase que gestiona los formatos, pasandole los formatos por defecto establecidos
			this._oFormatters = new formatters({
				timeFormat: this._oOwnerComponent.getUserConfig().timeFormat,
				dateFormat: this._oOwnerComponent.getUserConfig().dateFormat,
				decimalSeparator: this._oOwnerComponent.getUserConfig().decimalSeparator,
				thousandSeparator: this._oOwnerComponent.getUserConfig().thousandSeparator
			});
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
			// Los datos originales no se formatean porque lo hará los propios controles de ui5
			oData = this._processAdapModelDataFromGW(oData, false);
			// Se guardado los valores en el modelo original
			oViewDataModel.setProperty(constants.tableData.path.values, oData.getData());

			// Se guarda los valores originales para poder luego saber si un registro se ha modificado o no. 
			//Para evitar que las variables por referencias hagan los dos modelo iguales hay que usar el merge. Y como además, quiero guardarlo en el mismo path del modelo propio para simplificar
			// luego las comparativas hago uso de variables intermedias. 
			this._oOriginalViewData = new sap.ui.model.json.JSONModel();
			var oDataOriginal = merge({}, oData);
			this._oOriginalViewData.setProperty(constants.tableData.path.values, oDataOriginal.getData());

			// Se hace lo mismos pasos para los datos de template, pero estos no se guardan en el modelo de UI5 sino que se guardan como variable
			this._oDataTemplate = new sap.ui.model.json.JSONModel();
			this._oDataTemplate.setJSON(oDataGW.DATA_TEMPLATE);
			this._oDataTemplate = this._processAdapModelDataFromGW(this._oDataTemplate, false);

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
		formatterValue: function (sColumn, oValue) {
			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.char:

					if (mColumn.checkBox == true) {
						if (oValue == 'X')
							return true;
						else
							return false;

					} else {
						return oValue;
					}

					break;
				case constants.columnTtype.date:
					return oValue;
					break;
				case constants.columnTtype.time:
					return oValue;
					break;
				case constants.columnTtype.packed:
					return this._oFormatters.formatfloat(mColumn.decimals, oValue);
					break;

			}


		},
		// Elimina el formato del valor de una columna
		ParseValue: function (sColumn, oValue) {
			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.char:

					if (mColumn.checkBox == true) {
						if (oValue == 'X')
							return true;
						else
							return false;

					} else {
						return oValue;
					}

					break;
				case constants.columnTtype.date:
					return oValue;
					break;
				case constants.columnTtype.time:
					return oValue;
					break;
				case constants.columnTtype.packed:
					return this._oFormatters.parseFloat(mColumn.decimals, oValue);
					break;

			}


		},
		// Reemplaza carácteres extraños de los datos introducidos.
		// Ejemplo: En los campos  númericos eliminia cualquier carácter que no sea numeros o separador de miles o decimal
		replaceStrangeChar: function (sColumn, oValue) {
			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.char:

					if (mColumn.checkBox == true) {

					} else {

					}
					return oValue;
					break;
				case constants.columnTtype.date:
					return oValue;
					break;
				case constants.columnTtype.time:
					return oValue;
					break;
				case constants.columnTtype.packed:
					// A los campos númericos se les quita las letras
					return oValue.replace(/[^\d|.,]/g, '');
					break;
			}

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

				// Si el resgistro esta en blanco o tiene una actualización es cuando se hace la comparativa. Cualquier otro valor
				// no se hace porque valor lo que tenga
					if (oViewDataModel.getProperty(sPathUpdkz) == constants.tableData.fieldUpkzValues.update
					    || oViewDataModel.getProperty(sPathUpdkz) == '') {
						if (this._compareRowDataFromOriginal(sPath)) {
							console.log("iguales");
							oViewDataModel.setProperty(sPathUpdkz, '');
						} else {
							console.log("diferentes");
							oViewDataModel.setProperty(sPathUpdkz, sUpdkz);

						}
					}


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
			var mFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se recorren los datos leídos
			for (var z = 0; z < oData.oData.length; z++) {
				for (var x = 0; x < mFieldCatalog.length; x++) {
					// Los campos técnicos no tendrán campo de edición porque nunca se muestran
					if (this._isEditableFieldCatalog(mFieldCatalog[x])) {

						// se construye el nombre del nuevo campo que será el nombre del campo + un sufijo
						// constants.tableData.path.values +
						var sPathEditFieldname = "/" + z + "/" + mFieldCatalog[x].name + constants.tableData.suffix_edit_field;
						oData.setProperty(sPathEditFieldname, mFieldCatalog[x].edit);

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
		// Devuelve si un campos será editable según sus atributos
		_isEditableFieldCatalog: function (mFieldcatalog) {
			if (!mFieldcatalog.tech && mFieldcatalog.edit)
				return true;
			else
				return false;

		},
		// Compara una fila de datos con su valor original para ver si hay cambios
		_compareRowDataFromOriginal: function (sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			var bRowsEqual = true; // Por defecto las líneas son iguales
			// Se recupera el registro actual y el original para comparar
			var mRow = oViewDataModel.getProperty(sPath);
			var mOriginalRow = this._oOriginalViewData.getProperty(sPath);

			// Solo se van a comparar registros cuyos campos sean editables y que n sean técnicos en el catalogo de campos
			for (var x = 0; x < oViewDataModel.oData.columns.length; x++) {
				if (this._isEditableFieldCatalog(oViewDataModel.getProperty(constants.tableData.path.columns + "/" + x))) {
					// Nombre del campo a comparar
					var sFieldName = oViewDataModel.getProperty(constants.tableData.path.columns + "/" + x + "/name");

					// Ruta con el valor
					var sPathField = sPath + "/" + sFieldName;
					// Si no hay diferencias entonces se devuelve que no son iguales
					if (oViewDataModel.getProperty(sPathField) != this._oOriginalViewData.getProperty(sPathField)) {
						return false;
					}
				}

			}
			// Si llega aquí es que los campos son iguales
			return true;

		},
		// Se aplica los formatos a los datos vienen del servicio
		// En las opciones se puede escoger que tipo de campos se aplicará el formato.
		// Esto es necesario porque segun el contexto hay campos que no se puede formatear porque lo va hacer
		// el propio contro
		_formatValuesFromService: function (oData, mFormatOptions) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se pasa las opciones del parámetro a una variable local. Si no existe el parámetro se pone uno por defecto
			var mOptions = {
				formatNumber: mFormatOptions.formatNumber ? mFormatOptions.formatNumber : false,
				formatDate: mFormatOptions.formatDate ? mFormatOptions.formatDate : false,
				formatTime: mFormatOptions.formatTime ? mFormatOptions.formatTime : false
			};

			// Se recorren los datos leídos
			for (var z = 0; z < oData.oData.length; z++) {
				for (var x = 0; x < oViewDataModel.oData.columns.length; x++) {

					// Los campos técnicos no tendrán campo de edición porque nunca se muestran
					if (this._isEditableFieldCatalog(oViewDataModel.getProperty(constants.tableData.path.columns + "/" + x))) {
						var bFormat = true;

						switch (oViewDataModel.getProperty(constants.tableData.path.columns + "/" + x + "/type")) {
							case constants.columnTtype.packed:
								bFormat = mOptions.formatNumber;
								break;
						};
						// Se aplica formato si así se indica	
						if (bFormat) {
							// Se determina según el tipo de campo si hay que aplicar formato
							var sFieldName = oViewDataModel.getProperty(constants.tableData.path.columns + "/" + x + "/name");
							var sPathValue = "/" + z + "/" + sFieldName;
							var oNewValue = this.formatterValue(sFieldName, oData.getProperty(sPathValue));
							oData.setProperty(sPathValue, oNewValue);

						}

					}
				}
			}
			return oData;
		},
		// Proceso que adapta el modelo de datos que proviene de GW al modelo que se necesita en al aplicación
		_processAdapModelDataFromGW(oData, bApplyFormat) {
			// Se añaden los campos de control para poder determinar si un campo es editable o no.
			oData = this._addeditFields(oData);

			// Se establece a nivel de celda si el campo será editable o no
			oData = this._setInitialEditCellValues(oData);

			// Se adapta los valores según los tipos de campos pasados. Ejemplo: los campos checkbox que hay que cambiar la 'X'/'' por true/false.			
			//oData = this._convValuesFromService(oData);

			// Se formatea los valores provenientes del modelo para dejarlos tal cual aparecerán en la tabla. Esto se hace sobretodo
			// para los datos originales porque tienen que tener el mismo formato que los datos que se muestran en la tabla. Los datos
			// que se muestran en la tabla se les aplica el formato de manera automática al estar indicado en la columna.
			oData = this._formatValuesFromService(oData, {
				formatNumber: bApplyFormat ? bApplyFormat : false,
				formatDate: bApplyFormat ? bApplyFormat : false,
				formatTime: bApplyFormat ? bApplyFormat : false
			});

			return oData;
		}

	});
});
