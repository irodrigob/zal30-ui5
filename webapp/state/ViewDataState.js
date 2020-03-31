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

			// Se formatea el campo según la configuración de la columna
			var mFormatterResult = this._oView.formatterValue(mParams.column, mParams.value);

			mParamsOutput.value = mFormatterResult.newValue;

			// Si se ha aplicado formato es cuando se actualiza el modelo el propio.
			// Esto sobretodo se hace en los nuúmeros donde se introduce: quitan caracteres no validos(este caso no es necesario la actualización del modelo
			// porque se hace de manera automática cuando el valor formateado se pasa al valor del campo) y más decimales de los indicados en el campo . En el campo de los decimales, es especial.
			// Especial porque en el modelo tiene los decimales mal pero el input se ve bien. Pero para que luego no de problemas hay que sincronizar. Como no tengo manera de saber si han puesto
			// decimales de más, se sincroniza siempre en los campos númericos y listos.
			if (mFormatterResult.formatted)
				this._oView.updateValueModel(mParams.column, mParams.path, mParamsOutput.value);


			// Se informa en que línea se ha hecho el cambio
			this._oView.setRowUpdateIndicator(mParams.path, constants.tableData.fieldUpkzValues.update);

			return mParamsOutput;
		},
		// Evento que se lanza cuando se marcan líneas para borrar
		onDeleteEntries: function (aRows) {

			// Como se controla que el botón de borrar se habilite solo cuando se seleccionan registros, cuando llega a este método
			// seguro que hay líneas seleccionadas
			for (var x = 0; x < aRows.length; x++) {
				this._oView.setRowUpdateIndicator(constants.tableData.path.values + "/" + aRows[x], constants.tableData.fieldUpkzValues.delete);
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
		},
		// Evento que se produce al añadir una entrada
		onAddEntry:function(){
			this._oView.addEmptyRow();
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
