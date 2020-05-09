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
			var oData = JSON.parse(oDataGW.DATA);
			// Los datos originales no se formatean porque lo hará los propios controles de ui5
			oData = this._InitialProcessAdapModelDataFromGW(oData, false);

			// Guardo el número de registros
			this._lastTabix = oData.length;

			// Se guardado los valores en el modelo original
			oViewDataModel.setProperty(constants.tableData.path.values, oData);

			// Se guarda los valores originales para poder luego saber si un registro se ha modificado o no. 
			//Para evitar que las variables por referencias hagan los dos modelo iguales hay que usar el merge. Y como además, quiero guardarlo en el mismo path del modelo propio para simplificar
			// luego las comparativas hago uso de variables intermedias. 
			this._oOriginalViewData = new sap.ui.model.json.JSONModel();
			// El merge no crea bien el array, vamos que no es un array del todo y falla cuando se usa el find y demas. Por lo tanto replico el mismo proceso
			// que con los datos que se usarán
			//var oDataOriginal = merge({}, oData);
			var oDataOriginal = JSON.parse(oDataGW.DATA);
			oDataOriginal = this._InitialProcessAdapModelDataFromGW(oDataOriginal, false);
			this._oOriginalViewData.setProperty(constants.tableData.path.values, oDataOriginal);

			// Se hace lo mismos pasos para los datos de template, pero estos no se guardan en el modelo de UI5 sino que se guardan como variable
			this._oDataTemplate = new sap.ui.model.json.JSONModel();
			var aDataTemplate = JSON.parse(oDataGW.DATA_TEMPLATE);
			aDataTemplate = this._InitialProcessAdapModelDataFromGW(aDataTemplate, false);
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
						if (!mColumn.lowerCase) // Si no tiene permitido minúsculas se pasa el texto a mayúsculas
							return oValue.toUpperCase();
						else
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

			// Se devuelve en que posición se ha añadido el registro
			return sPath;


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
			mRow[constants.tableData.internalFields.rowStatusInternal] = '';
			mRow[constants.tableData.internalFields.rowStatusMsgInternal] = [];

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
							this.addMsgRowStatusMsgInternal(mRow, constants.messageType.error, text, aFieldsMandatory[x].name);
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
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Para simplificar procesos me quedo con los campos que son claves y que no sean técnicos, estos últimos no se visualizan nunca.
			aFieldCatalog = aFieldCatalog.filter(field => field.keyDDIC && !field.tech);

			// Se leen todo los registros
			for (var x = 0; x < aValues.length; x++) {
				var mRowValue = aValues[x];
				// Se ignora el registro que se esta validando o que este marcado para borrar
				if (mRowValue[constants.tableData.internalFields.tabix] != mRow[constants.tableData.internalFields.tabix] &&
					mRow[constants.tableData.internalFields.updkz] != constants.tableData.fieldUpkzValues.delete) {

					var bDuplicate = true;
					// Se recorren los campos editables y que no seán tecnicos, ya que los campos técnicos no se visualizan						
					for (var z = 0; z < aFieldCatalog.length; z++) {
						// Si el valor coincide se añade en que campos hay duplicados
						if (mRow[aFieldCatalog[z].name] == mRowValue[aFieldCatalog[z].name]) {

							var text = this._oI18nResource.getText("ViewData.rowValidate.rowDuplicate");
							this.addMsgRowStatusMsgInternal(mRow, constants.messageType.error, this._oI18nResource.getText("ViewData.rowValidate.rowDuplicate"));
							break; // se sale del proceso porque ya se ha encontrado una coincidencia

						}
					}

				}

			}

		},

		// Devuelve si hay datos con errores internos. Los errores internos son aquellos que se producen en vista		
		isDataWithInternalErrors: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			return aValues.find(values => values[constants.tableData.internalFields.rowStatusInternal] == constants.tableData.rowStatusValues.error) ? true : false;
		},
		// Devuelve si hay errores de SAP en los datos. Los errores de SAP se produces al llamar a los servicios
		isDataWithSAPErrors: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			return aValues.find(values => values[constants.tableData.internalFields.rowStatus] == constants.tableData.rowStatusValues.error) ? true : false;
		},
		// Devuelve si una fila tiene error en SAP, la fila se recupera a partir de un path
		isRowWithSAPErrorfromPath: function (sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			return this.isRowWithSAPError(oViewDataModel.getProperty(sPath));

		},
		// Devuelve si una fila tiene error en SAP a partir de una fila de datos
		isRowWithSAPError: function (mRow) {
			if (mRow[constants.tableData.internalFields.rowStatus] == constants.tableData.rowStatusValues.error)
				return true;
			else
				return false;

		},
		// Devuelve los mensajes de error de una fila de datos
		getRowStatusMsg: function (sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aMsgSAP = oViewDataModel.getProperty(sPath + "/" + constants.tableData.internalFields.rowStatusMsg);
			var aMsgInternal = oViewDataModel.getProperty(sPath + "/" + constants.tableData.internalFields.rowStatusMsgInternal);
			return aMsgSAP.concat(aMsgInternal);

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
		// Devuelve el contenido de una fila en formato JSON
		getRowFromPathFormatJSON: function (sPath) {
			return JSON.stringify(this.getRowFromPath(sPath));
		},
		// Devuelve el contenido de una fila para SAP. Esto se hace para enviar solo los campos que SAP necesita y no todos los
		// campos adicionales que se añaden intermanente. Esto reduce el tamaño y por lo tanto el volumen de datos a enviar
		getRowFromPathtoSAP: function (sPath) {
			return this._transfOModelDataValues2OData(this.getRowFromPath(sPath))
		},
		// devuelve el indicador de actualización de un path
		getUpdkzFromPath: function (sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mRow = oViewDataModel.getProperty(sPath);
			return mRow[constants.tableData.internalFields.updkz];
		},
		// Añade un mensaje en una fila según su path
		addMsgRowStatusMsgInternalFromPath: function (sPath, sType, sMessage, sColumn) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mRow = oViewDataModel.getProperty(sPath);
			if (mRow != undefined) {
				// se añade el mensaje a la fila
				this.addMsgRowStatusMsgInternal(mRow, sType, sMessage, sColumn);

				// Se guardan los datos en el modelo
				oViewDataModel.setProperty(sPath, mRow);
			}
		},
		// Añade un mensaje a una fila de datos
		addMsgRowStatusMsgInternal: function (mRow, sType, sMessage, sColumn) {
			mRow[constants.tableData.internalFields.rowStatusMsgInternal].push({
				TYPE: sType, //constants.messageType.error,
				MESSAGE: sMessage,
				FIELDNAME: sColumn ? sColumn : ''
			});
			// Se determina el rowStatus según los mensajes
			this.setRowStatusInternal(mRow);
		},
		// Determina el rowStatus de la fila según los mensajes
		setRowStatusInternal(mRow) {
			var aMsg = mRow[constants.tableData.internalFields.rowStatusMsg];
			var aMsgInternal = mRow[constants.tableData.internalFields.rowStatusMsgInternal];

			// Si hay un mensaje de error tanto interno como en el de SAP, el rowStatus se marca como erróneo. En caso contrario se deja tal cual estaba
			if (aMsg.find(type => type.TYPE == constants.messageType.error) ||
				aMsgInternal.find(type => type.TYPE == constants.messageType.error))
				mRow[constants.tableData.internalFields.rowStatusInternal] = constants.tableData.rowStatusValues.error;

		},
		// Actualiza una fila de datos al modelo
		updateServiceRow2ModelFromPath: function (sRow, sPath) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se pasa el string a JSON
			var mRowOData = JSON.parse(sRow);

			// Se pasan los valores de los campos que vienen en el catalogo de campos de SAP al registro que hay en el modelo
			var mRow = this._transfODataValues2ModelDatafromPath(sPath, mRowOData);

			// Se pasa el JSON a una array para poder llamar al método que formatea los valores que vienen de SAP
			var aValues = [mRow];

			// Se aplican los formatos y estilos
			aValues = this._processAdapModelDataFromGW(aValues, false);

			// Se determina el valor del RowStatus, porque puede cambiar en base los mensajes que vengan de SAP + los
			// internos de la propia aplicación
			//this.setRowStatusInternal(aValues[0]);

			// Se guardado los datos en la fila seleccionada
			oViewDataModel.setProperty(sPath, aValues[0]);

		},
		// Devuelve la tabla datos pero con formato para SAP. Es decir, si los campos añadidos en la propia aplicación
		getModelData2SAP: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);
			var aValuesSAP = [];

			// Se recorren los datos y se van adaptando fila a fila
			for (var x = 0; x < aValues.length; x++) {
				aValuesSAP.push(this._transfOModelDataValues2OData(aValues[x]));
			}

			return aValuesSAP;
		},
		// Devuelve los datos modificados en formato SAP
		getModelDataChanged2SAP: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			// Solo me quedo con lo que han sido modificados, borrados o insertados
			var aValuesChanged = aValues.filter(field => field[constants.tableData.internalFields.updkz] != '');

			// Se recorren los datos y se adaptan a SAP. 
			var aValuesSAP = [];
			for (var x = 0; x < aValuesChanged.length; x++) {
				aValuesSAP.push(this._transfOModelDataValues2OData(aValuesChanged[x]));
			}

			return aValuesSAP;

		},
		// Recupera los valores originales de los registros modificados
		getOriginalDataChanged2SAP: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			// Solo me quedo con lo que han sido modificados o borrados o insertados
			var aValuesChanged = aValues.filter(field => field[constants.tableData.internalFields.updkz] == constants.tableData.fieldUpkzValues.update || field[constants.tableData.internalFields.updkz] == constants.tableData.fieldUpkzValues.delete);

			var aOriginalDataChanged = [];
			for (var x = 0; x < aValuesChanged.length; x++) {
				var mRow = aValuesChanged[x];
				// Añadido el registro original en base al valor del campo ZAL30_TABIX
				aOriginalDataChanged.push(this._getRowOriginalData(mRow[constants.tableData.internalFields.tabix]));
			}
			return aOriginalDataChanged;
		},
		// Procesa los datos después que se graben en SAP
		processDataAfterSave: function (sData, aReturn) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);
			var aOriginalValues = this._oOriginalViewData.getProperty(constants.tableData.path.values);

			// Se pasa el string a JSON
			var aValuesSAP = JSON.parse(sData);

			var bHasError = aReturn.find(row => row.TYPE == constants.messageType.error) ? true : false;

			for (var x = 0; x < aValuesSAP.length; x++) {
				var mRowSAP = aValuesSAP[x];

				// Se localiza el registro en la tabla de datos del modelo
				var iIndex = this._getIndexFromTabix(aValues, mRowSAP[constants.tableData.internalFields.tabix]);

				// Se pasan los valores de los campos que vienen en el catalogo de campos de SAP al registro que hay en el modelo
				var mRow = this._transfODataValues2ModelData(aValues[iIndex], mRowSAP);

				// Para aprovechar los procesos de adaptación del registro lo paso a un array. Estos procesos
				// ajustes estilos, formatos de campos, etc..
				var aValuesTmp = [mRow];
				aValuesTmp = this._processAdapModelDataFromGW(aValuesTmp, false);
				mRow = aValuesTmp[0];

				// Se determina el valor del RowStatus, porque puede cambiar en base los mensajes que vengan de SAP + los
				// internos de la propia aplicación
				//this.setRowStatusInternal(mRow);

				// Si la fila no tiene errores y tampoco los hay a nivel global:
				// - se quita el indicador de actualización
				// - Se ajusta el modelo según la operación de actualización
				var sUpdkz = mRow[constants.tableData.internalFields.updkz]; // Me quedo con el valor original de la actualización
				if (!bHasError && mRow[constants.tableData.internalFields.rowStatus] != constants.tableData.rowStatusValues.error) {
					mRow[constants.tableData.internalFields.udpkz]

					// Ahora se procesa el status segun su actualización. Lo hago después de limpiar porque para la inserción como la 
					// actualización duplicaría el código y no sentido, por eso guardar el tipo de actualización en una variable
					switch (sUpdkz) {
						case constants.tableData.fieldUpkzValues.insert:
							// En la inserción se marca el registro como que existe en base de datos
							mRow[constants.tableData.internalFields.isDict] = 'X';

							// Se determina los campos que serán editables
							mRow = this.detEditableCellValue(mRow);

							// Se añaden el registro al array de valores originales
							aOriginalValues.push(mRow);

							break;
						case constants.tableData.fieldUpkzValues.delete:
							// Localizo donde esta el registro en los datos originales y lo borro
							var iOrigIndex = this._getIndexFromTabix(aOriginalValues, mRowSAP[constants.tableData.internalFields.tabix]);
							aOriginalValues.splice(iOrigIndex, 1);

							// Lo mismo para la tabla de datos final
							aValues.splice(iIndex, 1);
							break;
					}
				}
			}

			// Se guardan los datos principales como los originales en el modelo de datos
			oViewDataModel.setProperty(constants.tableData.path.values, aValues);
			this._oOriginalViewData.setProperty(constants.tableData.path.values, aOriginalValues);

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
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se recorren los datos leídos
			for (var z = 0; z < aValues.length; z++) {
				var mRow = aValues[z];

				for (var x = 0; x < aFieldCatalog.length; x++) {
					// Los campos técnicos no tendrán campo de edición porque nunca se muestran
					if (this._isEditableFieldCatalog(aFieldCatalog[x])) {

						// se construye el nombre del nuevo campo que será el nombre del campo + un sufijo						
						var sPathEditFieldname = aFieldCatalog[x].name + constants.tableData.suffix_edit_field;
						mRow[sPathEditFieldname] = aFieldCatalog[x].edit;

					}
				}

				// Se añade un campo que contendrán el control interno si la fila es erronea y los mensajes internos de esa fila
				mRow[constants.tableData.internalFields.rowStatusMsgInternal] = [];
				//mRow[constants.tableData.internalFields.rowStatusInternal] = "";

				// Se pasa la fila al array
				aValues[z] = mRow;
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

		// Proceso inicial que adapta los datos provenientes de GW al formato de la aplicación. Este método solo se lanza al inicio del proceso
		_InitialProcessAdapModelDataFromGW(aValues, bApplyFormat) {
			// Se añaden los campos de control para poder determinar si un campo es editable o no, status, etc...
			aValues = this._addCustomFields(aValues);

			// Se establece a nivel de celda si el campo será editable o no
			aValues = this._setInitialCellValues(aValues);

			// Proceso que formatea campo y estilos
			aValues = this._processAdapModelDataFromGW(aValues, bApplyFormat);

			return aValues;

		},
		// Proceso que adapta el modelo de datos que proviene de GW al modelo que se necesita en al aplicación
		_processAdapModelDataFromGW(aValues, bApplyFormat) {


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
		// Obtiene el registro de los datos a partir del valor del campo ZAL30_TABIX
		_getRowDataFromTabix: function (nTabix) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var mValues = this.oViewDataModel.getProperty(constants.tableData.path.values);

			return mValues.find(values => values[constants.tableData.internalFields.tabix] === nTabix);
		},
		// Obtiene el índice de los datos a partir del valor del campo ZAL30_TABIX
		_getIndexFromTabix: function (aValues, nTabix) {
			return aValues.findIndex(values => values[constants.tableData.internalFields.tabix] === nTabix);
		},
		// Completa los datos de determinados campos al añadir un nuevo registro
		_completeDataAddEmptyRow: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);

			// Se informa el campo ZAL30_TABIX con el valor siguiente al último calculado.  Este campo se usa
			// para control, validaciones, etc.
			this._lastTabix = this._lastTabix + 1;
			mRow[constants.tableData.internalFields.tabix] = this._lastTabix;

		},
		// Transfiere los datos del modelo Odata al modelo interno a partir de un path
		_transfODataValues2ModelDatafromPath: function (sPath, mRowOData) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se recupera el registro anterior
			var mRow = oViewDataModel.getProperty(sPath);

			// Se hace la transformación
			return this._transfODataValues2ModelData(mRow, mRowOData);

		},
		// Transfeire los datos de un modelo OData al modelo interno a partide una fila de datos
		_transfODataValues2ModelData: function (mRow, mRowOData) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se pasan los datos que vienen del catalogo de campos
			for (var x = 0; x < aFieldCatalog.length; x++) {
				if (!aFieldCatalog[x].fixColumn) // Las columnas fijas son añadidos por la aplicación y no están en SAP
					mRow[aFieldCatalog[x].name] = mRowOData[aFieldCatalog[x].name];
			}

			// Se pasan los campos internos que vienen de SAP pero no están en el catalogo.
			mRow[constants.tableData.internalFields.isDict] = mRowOData[constants.tableData.internalFields.isDict];
			mRow[constants.tableData.internalFields.tabix] = mRowOData[constants.tableData.internalFields.tabix];
			mRow[constants.tableData.internalFields.updkz] = mRowOData[constants.tableData.internalFields.updkz];
			mRow[constants.tableData.internalFields.rowStatus] = mRowOData[constants.tableData.internalFields.rowStatus];
			mRow[constants.tableData.internalFields.rowStatusMsg] = mRowOData[constants.tableData.internalFields.rowStatusMsg];
			mRow[constants.tableData.internalFields.style] = mRowOData[constants.tableData.internalFields.style];

			return mRow;
		},
		// Transfiere los datos del modelo interno al modelo Odata al modelo interno a partir de un path
		_transfOModelDataValues2OData: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			var mRowOData = {};

			// Se pasan los datos que vienen del catalogo de campos
			for (var x = 0; x < aFieldCatalog.length; x++) {
				if (!aFieldCatalog[x].fixColumn) // Las columnas fijas son añadidos por la aplicación y no están en SAP
					mRowOData[aFieldCatalog[x].name] = mRow[aFieldCatalog[x].name];
			}

			// Se pasan los campos internos que vienen de SAP pero no están en el catalogo.
			mRowOData[constants.tableData.internalFields.isDict] = mRow[constants.tableData.internalFields.isDict];
			mRowOData[constants.tableData.internalFields.tabix] = mRow[constants.tableData.internalFields.tabix];
			mRowOData[constants.tableData.internalFields.updkz] = mRow[constants.tableData.internalFields.updkz];
			mRowOData[constants.tableData.internalFields.rowStatus] = mRow[constants.tableData.internalFields.rowStatus];
			mRowOData[constants.tableData.internalFields.rowStatusMsg] = mRow[constants.tableData.internalFields.rowStatusMsg];
			mRowOData[constants.tableData.internalFields.style] = mRow[constants.tableData.internalFields.style];
			return mRowOData;
		}

	});
});
