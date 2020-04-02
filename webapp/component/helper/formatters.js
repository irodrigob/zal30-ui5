sap.ui.define(
	[
		"sap/ui/base/Object",
		"sap/ui/core/format/NumberFormat"
	],
	function (Object, NumberFormat) {
		"use strict";

		return Object.extend("com.ivancio.zal30-ui5.component.helper.formatter", {
			//////////////////////////////////	
			//        Public methods        //	
			//////////////////////////////////
			constructor: function (oDefaultValues) {
				Object.call(this);

				// Se guarda los valores por defecto, si el parámetro se pasa
				this._initValues(oDefaultValues);


			},
			// Formatea un valor según los decimales pasos
			formatfloat: function (nDecimals, oValue) {
				var oFormatObject = this.getFormatObjectFloat(nDecimals);
				return oFormatObject.format(oValue);
			},
			// Devuelve un objeto con la configuración necesaria para aplicar un formato
			getFormatObjectFloat: function (nDecimals) {

				var oFormatOptions = {
					decimals: nDecimals ? nDecimals : 0, // Si no se pasan decimales se establece que no tiene decimales
					groupingSeparator: this._oDefaultFormat.thousandSeparator,
					decimalSeparator: this._oDefaultFormat.decimalSeparator,
					maxFractionDigits: this._oDefaultFormat.decimalSeparator
				};

				return NumberFormat.getFloatInstance(oFormatOptions);

			},
			//////////////////////////////////	
			//        Private methods       //	
			//////////////////////////////////
			_initValues: function (oDefaultValues) {

				this._oDefaultFormat = {
					timeFormat: oDefaultValues.timeFormat ? oDefaultValues.timeFormat : "HHmmss",
					dateFormat: oDefaultValues.dateFormat ? oDefaultValues.dateFormat : "yyyyMMdd",
					decimalSeparator: oDefaultValues.decimalSeparator ? oDefaultValues.decimalSeparator : sap.ui.core.format.NumberFormat.getFloatInstance().oFormatOptions.decimalSeparator,
					thousandSeparator: oDefaultValues.thousandSeparator ? oDefaultValues.thousandSeparator : sap.ui.core.format.NumberFormat.getFloatInstance().oFormatOptions.decimalSeparator === "." ? "," : "."
				};


			}
		});

	});
