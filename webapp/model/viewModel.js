sap.ui.define([
	"com/ivancio/zal30-ui5/model/BaseModel",
	"sap/ui/model/json/JSONModel",
	"sap/base/util/merge",
	"sap/ui/model/Filter",
	"com/ivancio/zal30-ui5/constants/constants",	
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

			// Se recupera la clase que gestiona los formatos
			this._oFormatters = this._oOwnerComponent.getFormmatter();

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
			//this.viewInfo.viewName = mViewInfo.VIEWNAME;
			//this.viewInfo.viewDesc = mViewInfo.VIEWDESC;			
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

			// En modo edición se guardan los valores originales y la línea en blanco
			if (this.getEditMode() == constants.editMode.edit) {
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
			}

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

							// Se resetea los campos de control de error porque el registro vuelve a estar como se recupero de base de datos
							oViewDataModel.setProperty(sPath + "/" + constants.tableData.internalFields.rowStatusMsg, []);
							oViewDataModel.setProperty(sPath + "/" + constants.tableData.internalFields.rowStatusMsgInternal, []);
							oViewDataModel.setProperty(sPath + "/" + constants.tableData.internalFields.rowStatus, '');
							oViewDataModel.setProperty(sPath + "/" + constants.tableData.internalFields.rowStatusInternal, '');
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
		// Añade un registro vacia a los datos
		addEmptyRow: function () {

			// En el template solo habra un registro por eso se lee directamente la posición 0, para evitar el paso por referencia hago así
			// del merge para crear un objeto nuevo sin referencia. 
			// El merge evita que al añadir la primera vez el registro esta en blanco, pero cuando se informa ese nuevo registro en vista los datos
			// también se propagan al registro template por el tema del paso por referencia. Esto se evita con el merge
			var mNewRow = merge({}, this._oDataTemplate.getProperty("/0"));

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
				oViewDataModel.setProperty(constants.tableData.path.values, aValues);
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

			// Se resetea los values state de los campos
			this._resetValueState(mRow);

			// Campos obligatorios
			if (mOptions.mandatory)
				this.rowValidateMandatoryFields(mRow);

			// Duplicidad de campos clave
			if (mOptions.duplicateKeyFields)
				this.validateDuplicateKeyFields(mRow);

			// se informa el valueState de los campos en base a los valores del rowStatusMsg
			this._setValueStateFromRowStatusMsg(mRow);
		},
		// Validación de campos obligatorios
		rowValidateMandatoryFields: function (mRow) {
			var aFieldsMandatory = this._getMandatoryFields(); // Campos obligatorios

			for (var x = 0; x < aFieldsMandatory.length; x++) {
				switch (aFieldsMandatory[x].type) {
					case constants.columnTtype.char:
						var text = this._oI18nResource.getText("ViewData.rowValidate.fieldMandatory");
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
							this.addMsgRowStatusMsgInternal(mRow, constants.messageType.error, text);

							break; // se sale del proceso porque ya se ha encontrado una coincidencia

						}
					}

				}

			}

		},

		// Devuelve si hay datos con errores internos. Los errores internos son aquellos que se producen en vista.Se ignorarán los registros 
		// marcados para borrars
		isDataWithInternalErrors: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			return aValues.find(values => values[constants.tableData.internalFields.rowStatusInternal] == constants.tableData.rowStatusValues.error &&
				values[constants.tableData.internalFields.updkz] != constants.tableData.fieldUpkzValues.delete) ? true : false;
		},
		// Devuelve si hay errores de SAP en los datos. Los errores de SAP se produces al llamar a los servicios. Se ignorarán los registros 
		// marcados para borrar
		isDataWithSAPErrors: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			return aValues.find(values => values[constants.tableData.internalFields.rowStatus] == constants.tableData.rowStatusValues.error &&
				values[constants.tableData.internalFields.updkz] != constants.tableData.fieldUpkzValues.delete) ? true : false;
		},
		// Devuelve si se ha modificado algún registro
		isDataChanged: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			return aValues.find(values => values[constants.tableData.internalFields.updkz] != '') ? true : false;
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
			// En los modo de visualización el campo no viene informado
			if (aStyles) {

				// Se recorren los campos indicador en el array de estilos			
				for (var x = 0; x < aStyles.length; x++) {
					// Se monta el campo que indica si es editable
					var sEditField = aStyles[x].FIELDNAME + constants.tableData.suffixEditField;
					if (mRow[sEditField]) { // Si el campo existe se le asigna el valor
						if (aStyles[x].EDITABLE == "false")
							mRow[sEditField] = false;
						else
							mRow[sEditField] = true;
					}
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
			return this.transfOModelDataValues2OData(this.getRowFromPath(sPath))
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

			// Los posibles 

			// Se pasa el JSON a una array para poder llamar al método que formatea los valores que vienen de SAP
			var aValues = [mRow];

			// Se aplican los formatos y estilos
			aValues = this._processAdapModelDataFromGW(aValues, false);

			// se informa el valueState de los campos en base a los valores del rowStatusMsg
			this._setValueStateFromRowStatusMsg(aValues[0]);

			// Se guardado los datos en la fila seleccionada
			oViewDataModel.setProperty(sPath, aValues[0]);

		},
		// Devuelve la tabla de datos
		getModelData: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			return oViewDataModel.getProperty(constants.tableData.path.values);
		},
		// Devuelve la tabla datos pero con formato para SAP. Es decir, si los campos añadidos en la propia aplicación
		getModelData2SAP: function () {
			return this._convertValuesModel2ValuesSAP(this.getModelData());
		},
		// Devuelve los datos modificados
		getModelDataChanged: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			// Solo me quedo con lo que han sido modificados, borrados o insertados
			return aValues.filter(field => field[constants.tableData.internalFields.updkz] != '');

		},
		// Devuelve los datos modificados en formato SAP
		getModelDataChanged2SAP: function () {
			return  this._convertValuesModel2ValuesSAP(this.getModelDataChanged());
		},
		// Devuelve los datos a partir de su índice
		getModelDatafromIndex: function (aIndices) {
			var aValues = this.getModelData();
			var aValuesReturn = [];

			for (var x = 0; x < aIndices.length; x++)
				aValuesReturn.push(aValues[aIndices[x]]);

			return aValuesReturn;

		},
		// Devuelve los datos a partir de su índice en formato SAP
		getModelDatafromIndex2SAP: function (aIndices) {
			return this._convertValuesModel2ValuesSAP(this.getModelDatafromIndex(aIndices));
		},
		// Devuelve los path de los datos modificados en SAP
		getPathModelDataChanged: function () {
			var aPaths = [];

			// Registros modificados
			var aValuesChanged = this.getModelDataChanged();

			// Todos los valores de datos
			var aValues = this.getModelData();

			for (var x = 0; x < aValuesChanged.length; x++) {
				var mRow = aValuesChanged[x]; // Línea de datos
				// Se averigua el índice de la tabla global de datos a partir del campos tabix 
				var iIndex = this._getIndexFromTabix(aValues, mRow[constants.tableData.internalFields.tabix]);
				aPaths.push(constants.tableData.path.values + "/" + iIndex); // Path de acceso				
			}
			return aPaths;
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

				var mRow = aValues[iIndex];

				// Guardo el modo de actualización porque en SAP se resetea	
				var sUpdkz = mRow[constants.tableData.internalFields.updkz];

				// Se pasan los valores de los campos que vienen en el catalogo de campos de SAP al registro que hay en el modelo
				mRow = this._transfODataValues2ModelData(aValues[iIndex], mRowSAP);

				// Para aprovechar los procesos de adaptación del registro lo paso a un array. Estos procesos
				// ajustes estilos, formatos de campos, etc..
				var aValuesTmp = [mRow];
				aValuesTmp = this._processAdapModelDataFromGW(aValuesTmp, false);
				mRow = aValuesTmp[0];

				// se informa el valueState de los campos en base a los valores del rowStatusMsg
				this._setValueStateFromRowStatusMsg(mRow);

				// Si la fila no tiene errores y tampoco los hay a nivel global: 				
				// - Se ajusta el modelo según la operación de actualización

				if (!bHasError && mRow[constants.tableData.internalFields.rowStatus] != constants.tableData.rowStatusValues.error) {


					// Ahora se procesa el status segun su actualización. Lo hago después de limpiar porque para la inserción como la 
					// actualización duplicaría el código y no sentido, por eso guardar el tipo de actualización en una variable
					switch (sUpdkz) {
						case constants.tableData.fieldUpkzValues.insert:

							// Se determina los campos que serán editables
							mRow = this._detEditableCellValue(mRow);

							// Se clona el registro original para evitar pasar la referencia y no por valor
							var mRowClone = merge({}, mRow, {});

							// Se añaden el registro al array de valores originales
							aOriginalValues.push(mRowClone);

							break;
						case constants.tableData.fieldUpkzValues.delete:
							var iOrigIndex = this._getIndexFromTabix(aOriginalValues, mRowSAP[constants.tableData.internalFields.tabix]);
							aOriginalValues.splice(iOrigIndex, 1);

							// Lo mismo para la tabla de datos final
							aValues.splice(iIndex, 1);
							break;
						case constants.tableData.fieldUpkzValues.update:

							// Se clona el registro original para evitar pasar la referencia y no por valor
							var mRowClone = merge({}, mRow, {});

							var iOrigIndex = this._getIndexFromTabix(aOriginalValues, mRowSAP[constants.tableData.internalFields.tabix]);
							aOriginalValues[iOrigIndex] = mRowClone;


							break;
					}
				}
			}

			// Se guardan los datos principales como los originales en el modelo de datos
			oViewDataModel.setProperty(constants.tableData.path.values, aValues);
			this._oOriginalViewData.setProperty(constants.tableData.path.values, aOriginalValues);

		},
		// Guarda el modo de edición
		setEditMode: function (sMode) {
			this._editMode = sMode;
		},
		// Devuelve el modo de edición
		getEditMode: function () {
			return this._editMode;
		},
		// Guarda si esta bloqueada la vista
		setAlreadyBlocked: function (bValue) {
			this._alreadyBlocked = bValue;
		},
		// Devuelve si esta bloqueda la vista
		getAlreadyBlocked: function () {
			return this._alreadyBlocked;
		},
		// Guarda el usuario que bloquea la vista
		setLockedByUser: function (sUser) {
			this._lockedByUser = sUser;
		},
		// Devuelve si esta bloqueda la vista
		getLockedByUser: function () {
			return this._lockedByUser;
		},
		//Guarda el catalogo de campos que tienen ayuda para búsqueda
		setSearchHelpCatalog(aCatalog) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			this._aSearchHelpCatalog = [];

			// Solo se guardán aquellos campos que son editables. Así, no leemos datos de campos que no se van a poder editar
			for (var x = 0; x < aCatalog.length; x++) {
				var mField = aFieldCatalog.find(row => row.name == aCatalog[x].FIELDNAME);
				if (mField && mField.edit)
					this._aSearchHelpCatalog.push(aCatalog[x]);

			}

		},
		// Devuelve el catalogo de campos que tiene ayuda para búsqueda
		getSearchHelpCatalog() {
			return this._aSearchHelpCatalog;
		},
		// Devuelve los datos del catalogo de las ayudas para búsqueda para un determinado campo
		getSearchHelpCatalogField: function (sFieldName) {
			return this._aSearchHelpCatalog.find(row => row.FIELDNAME == sFieldName);
		},
		// Se guardar los datos para las ayudas para búsqueda
		setSearchHelpData: function (sFieldname, aValues) {

			// Los valores se pasan a una estructura adaptada
			for (var x = 0; x < aValues.length; x++) {
				this._aSearchHelpData.push({
					fieldName: aValues[x].FIELDNAME,
					code: aValues[x].CODE,
					description: aValues[x].DESCRIPTION
				});
			}
			// Se marca que el campo tiene ayuda para búsqueda.
			// aunque a esta función se llama solo si hay datos, pongo el control por si se cambia la funcionalidad			
			if (aValues.length)
				this._setFieldHasSearchHelp(sFieldname);
		},
		getSearchHelpDataField: function (sFieldName) {
			return this._aSearchHelpData.filter(data => data.fieldName == sFieldName);
		},
		// Transfiere los datos del modelo interno al modelo Odata al modelo interno a partir de un path
		transfOModelDataValues2OData: function (mRow) {
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

			this._editMode = ''; // Modo de edicion
			this._alreadyBlocked = false; // Vista bloqueada
			this._lockedByUser = ''; // Usuario del bloqueo
			this._aSearchHelpData = []; // Datos para las ayudas para búsqueda


		},
		// Devuelve los campos obligatorios
		_getMandatoryFields: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			return aFieldCatalog.filter(field => field.mandatory == true)
		},
		// Se convierte el catalogo del servicio en el formato propio de la aplicación
		_convertServiceFieldCatalog2Intern: function (mFieldCatalog) {

			var aColumns = [];
			for (var x = 0; x < mFieldCatalog.length; x++) {
				var mColumn = {
					name: mFieldCatalog[x].FIELDNAME,					
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

			// Se añade la columna de acciones, que contendra acciones individuales. Inicialmente solo tiene un icono, pero la idea
			// es tener una columna que pueda tener distintos iconos con acciones
			aNewFieldCatalog.push({
				name: constants.tableData.fixedColumns.actions,				
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
					// Los campos técnicos no tendrán campo de edición ni ayuda para búsqueda porque nunca se muestran
					if (this._isEditableFieldCatalog(aFieldCatalog[x])) {

						// se construye el nombre del nuevo campo que será el nombre del campo + un sufijo						
						var sPathEditFieldname = aFieldCatalog[x].name + constants.tableData.suffixEditField;
						mRow[sPathEditFieldname] = aFieldCatalog[x].edit;

						// Solo en los campos de tipo CHAR podrá haber ayuda para búsqueda
						if (aFieldCatalog.type == constants.columnTtype.char) {
							var sPathSearchHelpFieldname = aFieldCatalog[x].name + constants.tableData.suffixSearchHelpField;
							mRow[sPathSearchHelpFieldname] = false; // Por defecto no tendrá ayuda para búsqueda
						}

						// Se añaden dos campos que servirán para los valueState. Es decir, poder marcar determinados campos como erroneos
						mRow[aFieldCatalog[x].name + constants.tableData.suffixValueState.valueState] = constants.tableData.valueStates.ok;
						mRow[aFieldCatalog[x].name + constants.tableData.suffixValueState.valueStateText] = "";

					}
				}

				// En modo edición Se añade un campo que contendrán el control interno si la fila es erronea y los mensajes internos de esa fila
				if (this.getEditMode() == constants.editMode.edit) {
					mRow[constants.tableData.internalFields.rowStatusMsgInternal] = [];
					mRow[constants.tableData.internalFields.rowStatusInternal] = "";
				}

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
				aValues[z] = this._detEditableCellValue(aValues[z]);
			}
			return aValues;
		},
		// Devuelve si un campos será editable según sus atributos, y el estado de la vista.
		_isEditableFieldCatalog: function (mFieldcatalog) {
			if (!mFieldcatalog.tech && mFieldcatalog.edit && this._editMode)
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


			// Se informa el campo ZAL30_TABIX con el valor siguiente al último calculado.  Este campo se usa
			// para control, validaciones, etc.
			this._lastTabix = this._lastTabix + 1;
			mRow[constants.tableData.internalFields.tabix] = this._lastTabix;

			// Se marcan los campos que han de tener ayuda para búsqueda
			this._setFieldsHasSearchHelpinRow(mRow);

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
		// Se modifica si a nivel de celda es posible editar el campo segun los valores y atributos
		_detEditableCellValue: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);
			// Se recorren todos los campos del catalogo para poder acceder a cada campo de manera individual
			for (var x = 0; x < aFieldCatalog.length; x++) {

				// Si el campo de edición existe se continua el proceso. El IF lo hago en dos pasos para que quede más claro su funcionamiento
				if (mRow[aFieldCatalog[x].name + constants.tableData.suffixEditField]) {
					// Cualquier
					if (this.getEditMode() == constants.editMode.edit) {
						// Si el valor proviene del diccionario, es decir, que existe en base de datos y es un campo clave el campo se marca como no editable.
						if (mRow[constants.tableData.internalFields.isDict] == "X" && aFieldCatalog[x].keyDDIC) {
							mRow[aFieldCatalog[x].name + constants.tableData.suffixEditField] = false;
						}
					} else {
						mRow[aFieldCatalog[x].name + constants.tableData.suffixEditField] = false;
					}

				}
			}
			return mRow;
		},
		// Informa el valor del value State a un determinado campo
		_setValueStateField(mRow, sFieldname, sState, sStateText) {
			mRow[sFieldname + constants.tableData.suffixValueState.valueState] = sState;
			mRow[sFieldname + constants.tableData.suffixValueState.valueStateText] = sStateText;
		},
		// Limpia los values state de una fila
		_resetValueState: function (mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			for (var x = 0; x < aFieldCatalog.length; x++) {
				// Solo si el campo es editable se resetea el valor. Es la misma comprobación que se hace cuando
				// se añade el campo
				if (this._isEditableFieldCatalog(aFieldCatalog[x]))
					this._setValueStateField(mRow, aFieldCatalog[x].name, constants.tableData.valueStates.ok, "");
			}

		},
		// Marca un campo determinado que ya tiene valores para la ayuda para búsqueda
		_setFieldHasSearchHelp: function (sFieldName) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aValues = oViewDataModel.getProperty(constants.tableData.path.values);

			for (var x = 0; x < aValues.length; x++) {
				var mRow = aValues[x];
				mRow[sFieldName + constants.tableData.suffixSearchHelpField] = true;
			}

			oViewDataModel.setProperty(constants.tableData.path.values, aValues);
		},
		// Devuelve si un campo tiene ayuda para búsqueda
		_setFieldsHasSearchHelpinRow(mRow) {

			for (var x = 0; x < this._aSearchHelpCatalog.length; x++) {
				// Si existe al menos un registros de datos del campo se marca como que tiene, en caso contrario se marca que no tiene
				if (this._aSearchHelpData.find(data => data.fieldName == this._aSearchHelpCatalog[x].FIELDNAME))
					mRow[this._aSearchHelpCatalog[x].FIELDNAME + constants.tableData.suffixSearchHelpField] = true;
				else
					mRow[this._aSearchHelpCatalog[x].FIELDNAME + constants.tableData.suffixSearchHelpField] = false;

			}

		},
		// Informa los campos valueState en base a los campos de los rowStatusMsg tanto de SAP como interno
		_setValueStateFromRowStatusMsg(mRow) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			var aFieldCatalog = oViewDataModel.getProperty(constants.tableData.path.columns);

			// Se resetea los campos
			this._resetValueState(mRow);

			var aMsg = mRow[constants.tableData.internalFields.rowStatusMsg];
			var aMsgInternal = mRow[constants.tableData.internalFields.rowStatusMsgInternal];

			for (var x = 0; x < aFieldCatalog.length; x++) {
				// Solo los editables tienen value state
				if (this._isEditableFieldCatalog(aFieldCatalog[x])) {

					// Localizo si el campo tiene algun eror tanto en los mensajes de SAP como internos para el campo que se esta procesando
					var mMsg = aMsg.find(row => row.TYPE == constants.messageType.error && row.FIELDNAME == aFieldCatalog[x].name);
					var mMsgInternal = aMsgInternal.find(row => row.TYPE == constants.messageType.error && row.FIELDNAME == aFieldCatalog[x].name);
					if (mMsg || mMsgInternal) {
						// Pongo por defecto el error de SAP
						if (mMsg)
							this._setValueStateField(mRow, aFieldCatalog[x].name, constants.tableData.valueStates.error, mMsg.MESSAGE);
						else if (mMsgInternal)
							this._setValueStateField(mRow, aFieldCatalog[x].name, constants.tableData.valueStates.error, mMsgInternal.MESSAGE);
					}
				}


			}


		},
		_convertValuesModel2ValuesSAP: function (aValues) {
			// Se recorren los datos y se adaptan a SAP. 
			var aValuesSAP = [];
			for (var x = 0; x < aValues.length; x++) {
				aValuesSAP.push(this.transfOModelDataValues2OData(aValues[x]));
			}

			return aValuesSAP;
		},


	});
});
