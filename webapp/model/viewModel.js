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

			// Contador internos de registros
			this._lastTabix = 0;
		},
		// Guarda el catalogo de campos de la vista. El catalogo se convierte para adaptarlo a la vista
		setFieldCatalogFromService: function (aFieldCatalog) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			// se convierte el catalogo del servicio al interno	
			var aInteralFieldCatalog = this._convertServiceFieldCatalog2Intern(aFieldCatalog);

			// Se añaden los camps fijo propios de la aplicación
			aInteralFieldCatalog = this._addFixedColumnsFieldCatalog(aInteralFieldCatalog);

			// Se guarda en el modelo
			oViewDataModel.setProperty(constants.tableData.path.columns, aInteralFieldCatalog);
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
			var oData = JSON.parse(oDataGW.DATA); //Otra manera de haberlo hecho.
			// Los datos originales no se formatean porque lo hará los propios controles de ui5
			oData = this._processAdapModelDataFromGW(oData, false);

			// Guardo el número de registros
			this._lastTabix = oData.length;

			// Se guardado los valores en el modelo original
			oViewDataModel.setProperty(constants.tableData.path.values, oData);

			// Se guarda los valores originales para poder luego saber si un registro se ha modificado o no. 
			//Para evitar que las variables por referencias hagan los dos modelo iguales hay que usar el merge. Y como además, quiero guardarlo en el mismo path del modelo propio para simplificar
			// luego las comparativas hago uso de variables intermedias. 
			this._oOriginalViewData = new sap.ui.model.json.JSONModel();
			var oDataOriginal = merge({}, oData);
			this._oOriginalViewData.setProperty(constants.tableData.path.values, oDataOriginal);

			// Se hace lo mismos pasos para los datos de template, pero estos no se guardan en el modelo de UI5 sino que se guardan como variable
			this._oDataTemplate = new sap.ui.model.json.JSONModel();
			var aDataTemplate = JSON.parse(oDataGW.DATA_TEMPLATE);
			aDataTemplate = this._processAdapModelDataFromGW(aDataTemplate, false);
			this._oDataTemplate.setProperty("/", aDataTemplate);


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
				case constants.columnTtype.packed:
					return this._oFormatters.formatFloat(mColumn.decimals, oValue);
					break;
				case constants.columnTtype.integer:
					return this._oFormatters.formatInteger(oValue);
					break;
				default:
					return oValue;
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
				case constants.columnTtype.packed:
					return this._oFormatters.parseFloat(mColumn.decimals, oValue);
					break;
				case constants.columnTtype.integer:
					return this._oFormatters.parseInteger(oValue);
					break;
				default:
					return oValue;
					break;

			}


		},
		// Reemplaza carácteres extraños de los datos introducidos.
		// Ejemplo: En los campos  númericos eliminia cualquier carácter que no sea numeros o separador de miles o decimal
		replaceStrangeChar: function (sColumn, oValue) {
			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.packed:
				case constants.columnTtype.integer:
					// A los campos númericos se les quita las letras
					return oValue.replace(/[^\d|.,]/g, '');
					break;
				default:
					return oValue;
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
					if (oViewDataModel.getProperty(sPathUpdkz) == constants.tableData.fieldUpkzValues.update ||
						oViewDataModel.getProperty(sPathUpdkz) == '') {
						if (this._compareRowDataFromOriginal(sPath)) {
							oViewDataModel.setProperty(sPathUpdkz, '');
						} else {
							oViewDataModel.setProperty(sPathUpdkz, sUpdkz);
						}
					}
					break;
				case constants.tableData.fieldUpkzValues.delete:
				case constants.tableData.fieldUpkzValues.insert:
					oViewDataModel.setProperty(sPathUpdkz, sUpdkz);
					break;
			}
		},
		// Devuelve el número de campos clave. 		
		getNumberKeyFields: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			var nNumber = 0;

			for (var x = 0; x < mFielCatalog.length; x++) {
				// && !mFielCatalog[x].tech && !mFielCatalog[x].noOutput
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
			for (var x = 0; x < mFielCatalog.length; x++) {

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

			// Se informan determinados campos al añadir el registro
			this._completeDataAddEmptyRow(mNewRow);

			// Se recupera el modelo
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// El nuevo registro se añadira al final, para ello tengo que saber el número total de registros
			var sPath = constants.tableData.path.values + "/" + oViewDataModel.oData.values.length;

			// Validación de campos, aunque en una inserción no se ha introducido valores servirá para marcar sobretodo los campos
			// obligatorios. 
			// Nota: Se le indica que no valide duplicados porque no los va haber ya que se inserta un registro en blanco.
			this.rowValidate(mNewRow, {
				duplicateKeyFields: false
			});
			// Se añade el registro
			oViewDataModel.setProperty(sPath, mNewRow);

			// Se marca la fila con el indicador de actualización
			this.setRowUpdateIndicator(sPath, constants.tableData.fieldUpkzValues.insert);



		},
		// Borrr una entrada del modelo de datos
		deleteEntry: function (nRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			var sPath = constants.tableData.path.values + "/" + nRow;

			// Si el registro a borrar proviene del diccionario entonces se marca como borrado
			if (oViewDataModel.getProperty(sPath + "/" + constants.tableData.internalFields.isDict) == 'X') {
				this.setRowUpdateIndicator(sPath, constants.tableData.fieldUpkzValues.delete);
			} else { // Si no viene del diccionario se borra directamente
				var aValues = oViewDataModel.getProperty(constants.tableData.path.values);
				aValues.splice(nRow, 1);
				oViewDataModel.setProperty(sPath, aValues);
			}
		},
		// Validación de fila a partir de un path. Esta función actualizará el modelo con el resultado del proceso.
		rowValidatePath: function (sPath, mOptions) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mRow = oViewDataModel.getProperty(sPath);

			this.rowValidate(mRow, mOptions);

			// El modelo se actualiza porque al método llega el path 
			oViewDataModel.setProperty(sPath, mRow);

		},
		// Validación de los datos a nivel de fila
		rowValidate: function (mRow, mParamOptions) {

			// Como el parámetro de entrada puede no venir informado por defecto pongo todas las validaciones a true. Luego
			// Si vienen informadas ya se le indicará su valor
			var mOptions = {
				mandatory: true,
				duplicateKeyFields: true
			};

			if (mParamOptions != undefined && mParamOptions.mandatory != undefined)
				mOptions.mandatory = mParamOptions.mandatory;

			if (mParamOptions != undefined && mParamOptions.duplicateKeyFields != undefined)
				mOptions.duplicateKeyFields = mParamOptions.duplicateKeyFields;

			// Al iniciaio del proceso se inicializan los camops del control de la fila. Para que los errores anterior no se queden			
			mRow[constants.tableData.internalFields.rowStatus] = '';
			mRow[constants.tableData.internalFields.rowStatusMsg] = [];

			// Campos obligatorios
			if (mOptions.mandatory)
				this.rowValidateMandatoryFields(mRow);

			// Duplicidad de campos clave
			if (mOptions.duplicateKeyFields)
				this.validateDuplicateKeyFields(mRow);
		},
		// Validación de campos obligatorios
		rowValidateMandatoryFields: function (mRow) {
			var aFieldsMandatory = this._getMandatoryFields(); // Campos obligatorios

			for (var x = 0; x < aFieldsMandatory.length; x++) {
				switch (aFieldsMandatory[x].type) {
					case constants.columnTtype.char:
						var text = this._oI18nResource.getText("ViewData.rowValidate.fieldMandatory", [aFieldsMandatory[x].headerText]);
						if (mRow[aFieldsMandatory[x].name] == '') {
							mRow[constants.tableData.internalFields.rowStatus] = constants.tableData.rowStatusValues.error;
							mRow[constants.tableData.internalFields.rowStatusMsg].push({
								TYPE: constants.messageType.error,
								MESSAGE: text
							});
						}

						break;
					case constants.columnTtype.date:

						break;
					case constants.columnTtype.time:

						break;
					case constants.columnTtype.packed:

						break;
				}

			}

		},
		// Validación de campos duplicados
		validateDuplicateKeyFields: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);
			var aFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Para simplificar procesos me quedo con los campos que son claves y que no sean técnicos, estos últimos no se visualizan nunca.
			aFielCatalog = aFielCatalog.filter(field => field.keyDDIC && !field.tech);

			//debugger;

			// Se leen todo los registros
			for (var x = 0; x < aValues.length; x++) {
				var mRowValue = aValues[x];
				// Se ignora el registro que se esta validando o que este marcado para borrar
				if (mRowValue[constants.tableData.internalFields.tabix] != mRow[constants.tableData.internalFields.tabix] &&
					mRow[constants.tableData.internalFields.updkz] != constants.tableData.fieldUpkzValues.delete) {

					var bDuplicate = true;
					// Se recorren los campos editables y que no seán tecnicos, ya que los campos técnicos no se visualizan						
					for (var z = 0; z < aFielCatalog.length; z++) {
						// Si el valor no coincide se indica que no hay igualdad y se sale del proceso de búsqueda
						if (mRow[aFielCatalog[z].name] != mRowValue[aFielCatalog[z].name]) {
							bDuplicate = false;
							break;
						}
					}
					// Si hay registro duplicado, se marca el registro como erróneo
					if (bDuplicate) {
						var text = this._oI18nResource.getText("ViewData.rowValidate.rowDuplicate");
						mRow[constants.tableData.internalFields.rowStatus] = constants.tableData.rowStatusValues.error;
						mRow[constants.tableData.internalFields.rowStatusMsg].push({
							TYPE: constants.messageType.error,
							MESSAGE: this._oI18nResource.getText("ViewData.rowValidate.rowDuplicate")
						});
						break; // Se sale del proceso porque ya se ha encontrado una coincidea
					}

				}

			}

		},

		// Devuelve si hay datos erróneos en los datos		
		isDataWithErrors: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			if (aValues.find(values => values[constants.tableData.internalFields.rowStatus] == constants.tableData.rowStatusValues.error))
				return true;
			else
				return false;
		},
		// Devuelve los mensajes de error de una fila de datos
		getRowStatusMsg: function (sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			return oViewDataModel.getProperty(sPath + "/" + constants.tableData.internalFields.rowStatusMsg);
		},
		// Aplica lo indicado en el campo de estilos en una tabla de datos
		applyFieldStyleInData: function (oValues) {
			for (var x = 0; x < oValues.length; x++) {
				oValues[x] = this.applyFieldStyleInRow(oValues[x]);
			}
			return oValues;
		},
		// Aplica lo indicado en el campo de estilos en un registro
		applyFieldStyleInRow: function (mRow) {
			// Se recupera el campo de estilos
			var aStyles = mRow[constants.tableData.internalFields.style];
			// Se recorren los campos indicador en el array de estilos			
			for (var x = 0; x < aStyles.length; x++) {
				// Se monta el campo que indica si es editable
				var sEditField = aStyles[x].FIELDNAME + constants.tableData.suffix_edit_field;
				if (mRow[sEditField]) { // Si el campo existe se le asigna el valor
					if (aStyles[x].EDITABLE == "false")
						mRow[sEditField] = false;
					else
						mRow[sEditField] = true;
				}
			}
			return mRow;

		},
		// Devuelve los datos de un path determinado		
		getRowFromPath: function (sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			return oViewDataModel.getProperty(sPath);
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
		// Devuelve los campos obligatorios
		_getMandatoryFields: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			return aFielCatalog.filter(field => field.mandatory == true)
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
					tech: mFieldCatalog[x].TECH,
					fixColumn: false,
					datatype: mFieldCatalog[x].DATATYPE
				};
				aColumns.push(mColumn);
			};
			return (aColumns);

		},
		// Se añaden las columnas fijas al catalogo existente. Estas columas se pondrán al principio
		// de todo para que se vean en la aplicación		
		_addFixedColumnsFieldCatalog: function (aFieldCatalog) {
			var aNewFieldCatalog = [];

			// Columna de acciones, que contendra acciones individuales
			aNewFieldCatalog.push({
				name: constants.tableData.fixedColumns.actions,
				shortText: this._oI18nResource.getText('ViewData.fix.Column.state'),
				mediumText: this._oI18nResource.getText('ViewData.fix.Column.state'),
				longText: this._oI18nResource.getText('ViewData.fix.Column.state'),
				headerText: this._oI18nResource.getText('ViewData.fix.Column.state'),
				mandatory: false,
				noOutput: false,
				checkBox: false,
				keyDDIC: false,
				edit: false,
				type: 'C',
				len: 0,
				decimals: 0,
				lowerCase: false,
				tech: false,
				fixColumn: true
			});

			// Se añaden campos que provienen del servicio
			for (var x = 0; x < aFieldCatalog.length; x++) {
				aNewFieldCatalog.push(aFieldCatalog[x]);
			}

			return aNewFieldCatalog;

		},
		// Conversion de los datos procedentes del servicios
		_convValuesFromService: function (aValues) {

			// Se recuperán los campos que son checkbox
			var acheckBoxFields = this._checkBoxFieldsinCatalog();

			// Si hay campos a tratar se inicial el proceso.	
			if (acheckBoxFields.length) {
				// Se recorren todos los registros leídos
				for (var x = 0; x < aValues.length; x++) {
					var mRow = aValues[x];

					// Se recorre todos los campos de tipo checbox
					for (var y = 0; y < acheckBoxFields.length; y++) {
						if (mRow[acheckBoxFields[y].name] == 'X')
							mRow[acheckBoxFields[y].name] = true;
						else
							mRow[acheckBoxFields[y].name] = false;

						aValues[x] = mRow;
					}
				}
			}
			return aValues;

		},
		// Devuelve los campos que son checkbox
		_checkBoxFieldsinCatalog: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			return mFielCatalog.filter(field => field.checkBox == true)
		},
		// Añade campos de control al modelo de datos. Campos que se añaden:
		// 1.- Campo que va a permitir controlar a nivel de celda si se puede editar o no.
		// 2.- Campo para poder un status a nivel de fila si se ha modificado o no.
		_addCustomFields: function (aValues) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se recorren los datos leídos
			for (var z = 0; z < aValues.length; z++) {
				var mRow = aValues[z];

				for (var x = 0; x < mFieldCatalog.length; x++) {
					// Los campos técnicos no tendrán campo de edición porque nunca se muestran
					if (this._isEditableFieldCatalog(mFieldCatalog[x])) {

						// se construye el nombre del nuevo campo que será el nombre del campo + un sufijo						
						var sPathEditFieldname = mFieldCatalog[x].name + constants.tableData.suffix_edit_field;
						mRow[sPathEditFieldname] = mFieldCatalog[x].edit;

						aValues[z] = mRow;

					}
				}
			}
			return aValues;
		},
		// Establece la edición inicial de las celdas según sus valores. 
		// Esta función solo se usará en la lectura inicial
		_setInitialCellValues: function (aValues) {

			// Se recorren los datos leídos
			for (var z = 0; z < aValues.length; z++) {
				// constants.tableData.path.values
				// Se llama a la función encarga de determinar que celdas son editables
				aValues[z] = this.detEditableCellValue(aValues[z]);
			}
			return aValues;
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

			// Se recupera el registro actual y el original para comparar
			var mRow = oViewDataModel.getProperty(sPath);

			//La obtención del registro original se podría haber hecho con el valor de sPath, porque luego de hacer algunas pruebas
			// el modelo oData no cambia a pesar de quitar hacer ordenaciones. Pero, el problema puede venir si se borran líneas donde
			// el path del registro original y el que viene sea de líneas distintas. Por lo tanto, la manera más sencilla es encontrar
			// el registro por el valor del campo ZAL30_TABIX que es informado desde el backend.
			var mOriginalRow = this._getRowOriginalData(mRow[constants.tableData.internalFields.tabix]);

			if (mOriginalRow) {

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
			} else { // Si no se encuentra el registro original claramente no son iguales
				return false;
			}

		},
		// Se aplica los formatos a los datos vienen del servicio
		// En las opciones se puede escoger que tipo de campos se aplicará el formato.
		// Esto es necesario porque segun el contexto hay campos que no se puede formatear porque lo va hacer
		// el propio control
		_formatValuesFromService: function (aValues, mFormatOptions) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se pasa las opciones del parámetro a una variable local. Si no existe el parámetro se pone uno por defecto
			var mOptions = {
				formatNumber: mFormatOptions.formatNumber ? mFormatOptions.formatNumber : false,
				formatDate: mFormatOptions.formatDate ? mFormatOptions.formatDate : false,
				formatTime: mFormatOptions.formatTime ? mFormatOptions.formatTime : false
			};

			// Se recorren los datos leídos
			for (var z = 0; z < aValues.length; z++) {
				var mRow = aValues[z];
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
							mRow[sFieldName] = this.formatterValue(sFieldName, mRow[sFieldName]);
							aValues[z] = mRow;

						}

					}
				}
			}
			return aValues;
		},
		// Proceso que adapta el modelo de datos que proviene de GW al modelo que se necesita en al aplicación
		_processAdapModelDataFromGW(aValues, bApplyFormat) {
			// Se añaden los campos de control para poder determinar si un campo es editable o no.
			aValues = this._addCustomFields(aValues);

			// Se establece a nivel de celda si el campo será editable o no
			aValues = this._setInitialCellValues(aValues);

			// Se adapta los valores según los tipos de campos pasados. Ejemplo: los campos checkbox que hay que cambiar la 'X'/'' por true/false.			
			//oData = this._convValuesFromService(oData);

			// Se formatea los valores provenientes del modelo para dejarlos tal cual aparecerán en la tabla. Esto se hace sobretodo
			// para los datos originales porque tienen que tener el mismo formato que los datos que se muestran en la tabla. Los datos
			// que se muestran en la tabla se les aplica el formato de manera automática al estar indicado en la columna.
			aValues = this._formatValuesFromService(aValues, {
				formatNumber: bApplyFormat ? bApplyFormat : false,
				formatDate: bApplyFormat ? bApplyFormat : false,
				formatTime: bApplyFormat ? bApplyFormat : false
			});

			// Se llama el proceso que cambia los campos editables a nivel de campo dependiendo del valor que tenga el campo
			// de estilos en la línea de datos			
			this.applyFieldStyleInData(aValues);
			return aValues;
		},
		// Obtiene el registro de los datos originales a partir del valor del campo ZAL30_TABIX
		_getRowOriginalData: function (nTabix) {
			var mValues = this._oOriginalViewData.getProperty(constants.tableData.path.values);

			return mValues.find(values => values[constants.tableData.internalFields.tabix] === nTabix);
		},
		// Completa los datos de determinados cmapos al añadir un nuevo registro
		_completeDataAddEmptyRow: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mFielCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se informa el campo ZAL30_TABIX con el valor siguiente al último calculado.  Este campo se usa
			// para control, validaciones, etc.
			this._lastTabix = this._lastTabix + 1;
			mRow[constants.tableData.internalFields.tabix] = this._lastTabix;

		}

	});
});
