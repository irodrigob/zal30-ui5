sap.ui.define([
	"com/ivancio/zal30-ui5/state/ViewBaseState",
	"com/ivancio/zal30-ui5/service/ViewDataService",
	"com/ivancio/zal30-ui5/constants/constants"
], function (ViewBaseState, ViewDataService, constants) {
	"use strict";

	var oViewDataState = ViewBaseState.extend("com.ivancio.zal30-ui5.state.ViewBaseState", {
		//////////////////////////////////	
		//        Public methods        //	
		//////////////////////////////////	
		constructor: function (oComponent) {
			ViewBaseState.call(this, oComponent);

			// Se instancian los servicios que usaran el modelo
			this._initServices();

			// Se recupera la clase que gestiona los estados de la configuración de la vista
			this._viewConfState = this._oOwnerComponent.getState(this._oOwnerComponent.state.confView);

			// Inicialización del modelo interno
			this._initModel();


		},
		// Determinación del modo de edición según nivel de autorización
		determineEditModebyAuthLevel: function (sViewName) {
			// El nivel de autorización lo marca la información básica obtenida de la vistas leídas. 

			var mViewInfo = this._viewConfState.getViewInfo(sViewName);

			// Si se tiene nivel de autorización "full" entonces tiene permisos para todo. En caso contrario de visualización
			if (mViewInfo.LEVELAUTH == constants.mLevelAuth.full)
				this._editMode = constants.editMode.edit;
			else
				this._editMode = constants.editMode.view;

		},

		// Devuelve si se puede editar la vista
		isViewEditable: function () {
			if (this._editMode == constants.editMode.edit)
				return true;
			else
				return false;
		},

		// Lectura de la configuración y datos
		readConfDataView(mParams, oSuccessHandler, oErrorHandler) {
			var that = this;

			// Nota IRB: Las llamadas se tienen que construir en el propio array. Si se hacen en variables provoca que se llamen de manera inmediata y la recepción
			// del resultado en el promise.all no es correcta, ya que siempre se recibe los datos del primer servicio.			
			var aServices = [this._viewConfState.readView({
				viewName: mParams.viewName,
				fromViewData: true,
				editMode: this._editMode
			}), this.readDataView({
				viewName: mParams.viewName,
				editMode: this._editMode
			})];

			// Si en modo de edición no es de lectura se añade el servicio de bloqueo
			if (this._editMode == constants.editMode.edit) {
				aServices.push(this._oViewDataService.lockView({
					viewName: mParams.viewName
				}));
			}

			Promise.all(aServices).then((result) => {

					// En el registro 0 esta el resultado de la primera llamada
					that._oView = result[0];

					// En el registro 1 esta los datos y el template
					that._oView.setViewDataFromService(result[1]);



					// Si se esta editando hay que mirar el resultado del bloqueo. Si esta bloqueado la tabla no podrá ser editada
					if (that._editMode == constants.editMode.edit)
						that._determineEdtModelAccordingLockView(result[2]);


					// Se ejecuta el código del Success
					oSuccessHandler();

				},
				(error) => {
					oErrorHandler(error);

				});

		},
		// lectura de los datos de la vista
		readDataView: function (mParams) {
			return this._oViewDataService.readData({
				viewName: mParams.viewName,
				editMode: mParams.editMode
			});
		},
		// Se devuelve los datos de cabecera de la vista
		getViewInfo: function () {
			return {
				viewName: this._oView.viewInfo.viewName,
				viewDesc: this._oView.viewInfo.viewDesc
			};
		},
		// Se devuelve las columnas de la tabla a partir del catalogo de campos
		getColumnsTable: function () {
			return (this._oView.getFieldCatalog());
		},
		// Devuelve los datos de la vista
		getViewData() {
			return this._oView.getViewData();
		},
		// Devuelve si la vista ha sido bloqueada
		getViewAlreadyLocked: function () {
			return this._alreadyBlocked;
		},
		// Devuelve el usuario que tiene bloqueado la vista
		getUserAlreadyBlocked: function () {
			return this._lockedByUser;
		},
		// Evento que se lanza cuando un datos de la vista ha sido modificado. Este evento es mixto entre la controladora de la vista
		// que determina donde se ha disparado el evento y aquí, que es el que hace las comprobaciones y validaciones
		// La estructura con los datos modificados tendra los siguientes campos:
		// path, column, value
		onValueCellChanged: function (mParams) {
			// Se inicializa la matriz con los datos de salida
			var mParamsOutput = {
				value: mParams.value
			};

			// Se quitan cáracteres extraños o no validos. Ejemplo, en los campos númericos que no se pueda poner carácteres que no sea numéros o separador de miles o decimal.
			mParamsOutput.value = this._oView.replaceStrangeChar(mParams.column, mParams.value);

			// Se quita el formato que tiene el campo, necesario para poder grabar en el modelo y luego comparar si los datos han cambiado
			mParamsOutput.value = this._oView.ParseValue(mParams.column, mParamsOutput.value);

			// Se guarda el valor en el modelo propio. Realmente este paso es necesario por dos motivos:
			// 1) Cuando se ponen decimales de más, el campo tiene los decimales correctos pero no en el modelo oData que se guardan de más. Esto luego puede provocar errores al enviar a SAP.
			// 2) Para poder hacer comparaciones entre modelo original y el nuevo. Básico para saber el modo de actualización correcto. Sin el paso anterior hacer la comparación no sería posible			
			this._oView.updateValueModel(mParams.column, mParams.path, mParamsOutput.value);

			// Se informa en que línea se ha hecho el cambio
			this._oView.setRowUpdateIndicator(mParams.path, constants.tableData.fieldUpkzValues.update);

			// Se aplica el formato para que pueda ser devuelto y se grabe correctamente en el campo.
			mParamsOutput.value = this._oView.formatterValue(mParams.column, mParamsOutput.value);

			return mParamsOutput;
		},
		// Evento que se lanza cuando se marcan líneas para borrar
		onDeleteEntries: function (aRows) {

			// Como se controla que el botón de borrar se habilite solo cuando se seleccionan registros, cuando llega a este método
			// seguro que hay líneas seleccionadas
			for (var x = 0; x < aRows.length; x++) {
				this._oView.deleteEntry(aRows[x]);
			}

		},
		// Devuelve el numero de columnas clave y visible
		getNumberKeyFields: function () {
			return this._oView.getNumberKeyFields();
		},
		// Establece la visibilidad de los objetos asociados a la edición, como los botones de añadir y borrar
		setVisibleEditButtons(bVisible) {
			var oViewDataModel = this._oOwnerComponent.getModel(constants.jsonModel.viewData);
			oViewDataModel.setProperty("/btnDeletedVisible", bVisible);
			oViewDataModel.setProperty("/btnAddVisible", bVisible);
			oViewDataModel.setProperty("/btnSaveVisible", bVisible);
		},
		// Evento que se produce al añadir una entrada
		onAddEntry: function () {
			this._oView.addEmptyRow();
		},
		// Devuelve si hay registros erroneos
		isDataWithErrors: function () {
			return this._oView.isDataWithErrors();

		},
		// Devuelve los mensajes de error de una fila de datos
		getRowStatusMsg: function (sPath) {
			return this._oView.getRowStatusMsg(sPath);
		},
		//////////////////////////////////	
		//        Private methods       //	
		//////////////////////////////////	
		_initServices: function () {
			// Se instancia el servicio de configuraciOn de la vista pasandole: contexto del component necesario para poder acceder
			// al modelo de la aplicacion definido en el manifest
			this._oViewDataService = new ViewDataService(this._oOwnerComponent);

		},
		// Determina el modo de edición dependiendo si la tabla esta bloqueda
		_determineEdtModelAccordingLockView: function (mResult) {
			this._alreadyBlocked = mResult.ALREADYLOCKED;
			this._lockedByUser = mResult.LOCKBYUSER;

			if (this._alreadyBlocked) {
				// Con bloqueo la vista solo se puede visualizar
				this._editMode = constants.editMode.view;

				// Además se ocultan los botones asociados a la edición
				this.setVisibleEditButtons(false);
			} else {
				this.setVisibleEditButtons(true);
			}
		},
		_initModel: function () {
			// Modo de edición
			this._editMode = '';
			this._alreadyBlocked = false;
			this._lockedByUser = '';
		}
	});
	return oViewDataState;
});
