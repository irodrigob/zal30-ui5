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
		setViewDataFromService: function (sData) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			
			// Debido a que el JSON viene en un literal para poderlo usarla hay que parsearlo.								
			var oData = new sap.ui.model.json.JSONModel();
			oData.setJSON(sData);

			oViewDataModel.setProperty("/values", oData.getData());

			// Se adapta los valores según los tipos de campos pasados. Ejemplo: los campos checkbox que hay que cambiar la 'X'/'' por true/false.
			//this._oViewData = this._convValuesFromService(this._oViewData);
			this._convValuesFromService(oViewDataModel);

			// Se guarda el valor original
			this._oOriginalViewData = oViewDataModel; //this._oViewData;

			// Se añaden los campos de control para poder determinar si un campo es editable o no.
			this._addeditFields();

			// Se establece a nivel de celda si el campo será editable o no
			this._setInitialEditCellValues();


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
			var oNewValue = oOldValue;

			// Obtenemos la información de la columna	
			var mColumn = this.getColumnInfo(sColumn);
			switch (mColumn.type) {
				case constants.columnTtype.char:

					if (mColumn.checkBox == true) {

					} else {

					}
					return oNewValue;
					break;
				case constants.columnTtype.date:
					return oNewValue;
					break;
				case constants.columnTtype.time:
					return oNewValue;
					break;
				case constants.columnTtype.packed:
					// A los campos númericos se les quita las letras
					return oNewValue.replace(/[^\d|.,]/g, '');
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
		// Actualiza el indicador de actualización a nivel de línea
		setRowUpdateIndicator(sColumn, sPath, oValue, sUpdkz) {
			// Se recupera la fila donde se ha hecho el cambio
			var mRow = this._oViewData.getProperty(sPath);

			// Si no hay indicador previo se informa el pasado
			if (mRow[constants.tableData.internalFields.updkz] == "") {
				mRow[constants.tableData.internalFields.updkz] = sUpdkz; //constants.tableData.fieldUpkzValues.update;
			}


			// Se actualiza en el modelo
			this._oViewData.setProperty(sPath, mRow);

		},
		// Devuelve el número de campos clave. 		
		getNumberKeyFields: function () {
			var nNumber = 0;

			for (var x = 0; x < this._fieldCatalog.length; x++) {
				// && !this._fieldCatalog[x].tech && !this._fieldCatalog[x].noOutput
				if (this._fieldCatalog[x].keyDDIC)
					nNumber = nNumber + 1;
			}
			return nNumber;
		},
		// Se modifica si a nivel de celda es posible editar el campo segun los valores y atributos
		detEditableCellValue: function (mRow) {
			// Se recorren todos los campos del catalogo para poder acceder a cada campo de manera individual
			for (var x = 0; x < this._fieldCatalog.length; x++) {

				// Si el campo de edición existe se continua el proceso. El IF lo hago en dos pasos para que quede más claro su funcionamiento
				if (mRow[this._fieldCatalog[x].name + constants.tableData.suffix_edit_field]) {
					// Si el valor proviene del diccionario, es decir, que existe en base de datos y es un campo clave el campo se marca como no editable.
					if (mRow[constants.tableData.internalFields.isDict] == "X" && this._fieldCatalog[x].keyDDIC) {
						mRow[this._fieldCatalog[x].name + constants.tableData.suffix_edit_field] = false;
					}
				}
			}
			return mRow;
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////		  
		// Inicialización de variables
		_initModel: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			oViewDataModel.setProperty("/columns", {});
			oViewDataModel.setProperty("/values", {});
			//this._oViewData = new sap.ui.model.json.JSONModel();
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
		_convValuesFromService: function (oViewDataModel) {

			// Se recuperán los campos que son checkbox
			var acheckBoxFields = this._checkBoxFieldsinCatalog();

			// Si hay campos a tratar se inicial el proceso.	
			if (acheckBoxFields.length) {
				// Se recorren todos los registros leídos
				for (var x = 0; x < oViewDataModel.oData.values.length; x++) {

					// Se recorre todos los campos de tipo checbox
					for (var y = 0; y < acheckBoxFields.length; y++) {
						// Se recupera el valor
						var sPath = constants.tableData.path.values + "/" + x + "/" + acheckBoxFields[y].name;
						if (oViewDataModel.getProperty(sPath) == 'X')
						oViewDataModel.setProperty(sPath, true)
						else
						oViewDataModel.setProperty(sPath, false)
					}
				}
			}

		},
		// Devuelve los campos que son checkbox
		_checkBoxFieldsinCatalog: function () {
			return this._fieldCatalog.filter(field => field.checkBox == true)
		},
		// Añade campos de control al modelo de datos
		_addeditFields: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			// Se recorren los datos leídos
			for (var z = 0; z < oViewDataModel.oData.values.length; z++) {
				for (var x = 0; x < this._fieldCatalog.length; x++) {
					// Los campos técnicos no tendrán campo de edición porque nunca se muestran
					if (!this._fieldCatalog[x].tech) {

						// se construye el nombre del nuevo campo que será el nombre del campo + un sufijo
						var sPathEditFieldname = constants.tableData.path.values + "/" + z + "/" + this._fieldCatalog[x].name + constants.tableData.suffix_edit_field;
						oViewDataModel.setProperty(sPathEditFieldname, this._fieldCatalog[x].edit);

					}
				}
			}
		},
		// Establece la edición inicial de las celdas según sus valores. 
		// Esta función solo se usará en la lectura inicial
		_setInitialEditCellValues: function () {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			// Se recorren los datos leídos
			for (var z = 0; z < oViewDataModel.oData.values.length; z++) {
				var sPath = constants.tableData.path.values + "/" + z + "/"; // Path de acceso al modelo
				var sRow = oViewDataModel.getProperty(sPath); // Recuperación del modelo
				// Se llama a la función encarga de determinar que celdas son editables
				var sNewRow = this.detEditableCellValue(sRow);
				oViewDataModel.setProperty(sPath, sNewRow); // Actualización del modelo

			}
		}

	});
});
