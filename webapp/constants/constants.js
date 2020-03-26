sap.ui.define([], function () {
	"use strict";
	var oConstants = {

		mLevelAuth: {
			full: "F",
			read: "R",
			non: "N"
		},
		editMode: {
			edit: "U",
			view: "V"
		},
		mMessageType: {
			error: "E",
			success: "S",
			warning: "W"
		},
		objectsId: {
			viewSelect: {
				viewInput: "viewInput"
			},
			viewData: {
				tableData: "tableData"
			}
		},
		services: {
			filter: {
				langu: "LANGU",
				viewName: "VIEWNAME",
				mode: "MODE"
			}
		},
		jsonModel: {
			viewConf: "ViewConf",
			ViewSelect: "ViewSelectModel",
			viewData: "viewData",
			dialog: "dialog"
		},
		columnTtype: {
			char: "C",
			date: "D",
			time: "T",
			packed: "P"
		},
		tableData: {
			columnObjectType: {
				input: "input",
				datePicker: "datepicker",
				timePicker: "timepicker",
				checkbox: "checkbox"
			},
			suffix_edit_field: "_ZAL30_EDIT",
			internalFields: {
				isDict: "ZAL30_IS_DICT",
				tabix: "ZAL30_TABIX",
				updkz: "ZAL30_UPDKZ"
			},
			fieldUpkzValues: {
				update: "U",
				insert: "I",
				delete: "D"
			},
			path:{
				values:"/values",
				columns:"/columns"
			}

		}
	};
	return oConstants

});
