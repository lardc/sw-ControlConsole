include("SiC_Calc.js");

sic_device_part_number = "NONE";
sic_device_serial_number = "00000000";

sic_ch_vge = 1;
sic_ch_ice = 2;
sic_ch_vce = 3;

print("Для вывода справки выполните doc()");
print("Для отображения текущих настроек выполните inf()");
print("Доступные COM-порты:");
pp();

function SiC_Plot(Data)
{
	plot3(Data.Vge, Data.Vce, Data.Ice, 1, 0);
}

function SiC_PrintRF(Data)
{
	print("S_max:\t"  + Data.S_max.toFixed(1));
	print("S_amp:\t"  + Data.S_amp.toFixed(1));
	print("S_rf:\t"   + Data.S_rf.toFixed(0));
	print("t_rf:\t"   + Data.t_rf.toFixed(1));
	print("t_min:\t"  + Data.t_min);
	print("t_max:\t"  + Data.t_max);
}

function SiC_Main(Curves)
{
	var IsDiode = SiC_CALC_IsDiode(Curves);
	var IsHigh = SiC_CALC_IsHighElement(Curves);
	var OnMode = IsDiode ? false : SiC_CALC_OnMode(Curves);
	
	var out_data = [];
	var RiseFallData = SiC_CALC_VI_RiseFall(Curves, IsDiode);
	
	print("Тип СПП:\t" + (IsDiode ? "диод" : "ключ"));
	if (!IsDiode)
	{
		print("Режим ключа:\t" + (OnMode ? "включение" : "выключение"));
		print("Положение:\t" + (IsHigh ? "верхний" : "нижний"));
	}
	print("");
	print("Uce *" + ":\t\t" + RiseFallData.V_points.S_amp.toFixed(0) + "\t(V)");
	print("Uce_max *" + ":\t" + RiseFallData.V_points.S_max.toFixed(0) + "\t(V)");
	print("Ice *" + ":\t\t" + RiseFallData.I_points.S_amp.toFixed(0) + "\t(A)");
	print("Ice_max *" + ":\t" + RiseFallData.I_points.S_max.toFixed(0) + "\t(A)");
	print("* - значения для справки");
	print("");
	
	if (!IsDiode)
	{
		SiC_DataArrayCompose(out_data, "dI/dt_" + (OnMode ? "on" : "off") + ":\t", RiseFallData.I_points.S_rf.toFixed(0), "\t(A/us)");
		SiC_DataArrayCompose(out_data, "t" + (OnMode ? "r" : "f") + "i:\t\t", RiseFallData.I_points.t_rf.toFixed(0), "\t(ns)");
		if (!OnMode)
			SiC_DataArrayCompose(out_data, "Icpk" + ":\t\t", RiseFallData.I_points.S_max.toFixed(0), "\t(A)");
		SiC_DataArrayCompose(out_data, "dU/dt_" + (OnMode ? "on" : "off") + ":\t", RiseFallData.V_points.S_rf.toFixed(0), "\t(V/us)");
		SiC_DataArrayCompose(out_data, "t" + (OnMode ? "f" : "r") + "v:\t\t", RiseFallData.V_points.t_rf.toFixed(0), "\t(ns)");
		SiC_DataArrayCompose(out_data, "E" + (OnMode ? "on" : "off") + ":\t\t", SiC_CALC_Energy(Curves).Energy.toFixed(0), "\t(mJ)");
		if (!IsHigh)
			SiC_DataArrayCompose(out_data, "tdi_" + (OnMode ? "on: " : "off:") + "\t", SiC_CALC_Delay(Curves).toFixed(0), "\t(ns)");
		if (!OnMode)
		{
			print("");
			SiC_DataArrayCompose(out_data, "Uce_100" + ":\t", RiseFallData.V_points.S_amp.toFixed(0), "\t(V)");
			SiC_DataArrayCompose(out_data, "Uce_max" + ":\t", RiseFallData.V_points.S_max.toFixed(0), "\t(V)");
		}
	}
	
	if (OnMode || IsDiode)
	{
		var Recovery = SiC_CALC_Recovery(Curves, IsDiode);
		
		if (!IsDiode)
			print("");
		SiC_DataArrayCompose(out_data, "Irm [A]" + ":\t", Recovery.Irrm.toFixed(0), "\t(A)");
		SiC_DataArrayCompose(out_data, "trr" + ":\t\t", Recovery.trr.toFixed(0), "\t(ns)");
		SiC_DataArrayCompose(out_data, "trr1" + ":\t\t", Recovery.trr1.toFixed(0), "\t(ns)");
		SiC_DataArrayCompose(out_data, "trr2" + ":\t\t", Recovery.trr2.toFixed(0), "\t(ns)");
		SiC_DataArrayCompose(out_data, "Qrr" + ":\t\t", Recovery.Qrr.toFixed(0), "\t(uC)");
		SiC_DataArrayCompose(out_data, "Erec" + ":\t\t", Recovery.Energy.toFixed(1), "\t(mJ)");
	}
	
	var FilePath = "data\\" + SiC_ComposeFileName();
	SiC_ArrangeDataInFile(OnMode, IsHigh, IsDiode, FilePath, out_data);
	print("\nРезультат записан в: " + FilePath);
}

function SiC_ArrangeDataInFile(OnMode, IsHigh, IsDiode, FilePath, Data)
{
	var out = [];
	
	out[0] = sic_device_part_number;
	out[1] = sic_device_serial_number;
	out[2] = "-- low --";
	out[24] = "-- high --";
	
	if (IsDiode)
	{
		for (var i = 0; i < 6; ++i)
			out[i + 38] = Data[i];
	}
	else if (OnMode && !IsHigh)
	{
		for (var i = 0; i < 6; ++i)
			out[i + 3] = Data[i];
		
		for (var i = 6; i < 12; ++i)
			out[i + 10] = Data[i];
	}
	else if (!OnMode && !IsHigh)
	{
		for (var i = 0; i < 7; ++i)
			out[i + 9] = Data[i];
		
		for (var i = 7; i < 9; ++i)
			out[i + 22 - 7] = Data[i];
	}
	else if (OnMode && IsHigh)
	{
		for (var i = 0; i < 5; ++i)
			out[i + 25] = Data[i];
		
		for (var i = 5; i < 11; ++i)
			out[i + 33] = Data[i];
	}
	else if (!OnMode && IsHigh)
	{
		for (var i = 0; i < 6; ++i)
			out[i + 31] = Data[i];
		
		for (var i = 6; i < 8; ++i)
			out[i + 44 - 6] = Data[i];
	}
	
	// fill empty cells
	for (var i = 0; i < out.length; ++i)
	{
		if (out[i] == null)
			out[i] = " ";
	}
	
	save(FilePath, out);
}

function SiC_DataArrayCompose(DataArr, Str1, Value, Str2)
{
	DataArr.push(Value);
	print(Str1 + Value + Str2);
}

function SiC_ComposeFileName()
{
	return (sic_device_part_number + " " + sic_device_serial_number + " " + SiC_GetDateStr() + ".txt");
}

function SiC_GetDateStr()
{
	return (new Date()).toISOString().slice(0, 19).replace(/[\-:]/g, "").replace("T", "_");
}

function SiC_Start()
{
	dev.c(101);
	sleep(200);
	SiC_Main(SiC_GD_GetCurves(3, 2, 1));
}

function SiC_PrintChannelInfo()
{
	print("Текущие настройки каналов измерения");
	print("Канал измерения Vge:\t\t" + sic_ch_vge);
	print("Канал измерения Ice:\t\t" + sic_ch_ice);
	print("Канал измерения Vce:\t\t" + sic_ch_vce);
}

function pn(PartNumber)
{
	sic_device_part_number = PartNumber;
	SiC_PrintPN();
}

function SiC_PrintPN(LongTab)
{
	print("Тип прибора:" + (LongTab ? "\t\t\t" : "\t") + sic_device_part_number);
}

function sn(SerialNumber)
{
	sic_device_serial_number = SerialNumber;
	
	SiC_PrintPN();
	SiC_PrintSN();
}

function SiC_PrintSN(LongTab)
{
	print("Серийный номер:" + (LongTab ? "\t\t\t" : "\t") + sic_device_serial_number);
}

function scope(ComPort, ch_Vge, ch_Ice, ch_Vce)
{
	sic_ch_vge = ch_Vge;
	sic_ch_ice = ch_Ice;
	sic_ch_vce = ch_Vce;
	
	if (ComPort != 0)
	{
		SiC_GD_Init(ComPort);
		print("Идентификатор осциллографа: " + TEK_Exec("id?") + "\n");
	}
	
	SiC_PrintChannelInfo();
}

function probe(VceProbe, IceShuntRes)
{
	sic_gd_vce_probe = VceProbe;
	sic_gd_ice_shunt = IceShuntRes / 1000;
	
	SiC_PrintProbeInfo();
}

function SiC_PrintProbeInfo()
{
	print("Текущие настройки измерительных пробников");
	print("Сопротивление шунта Ice, мОм:\t" + (sic_gd_ice_shunt * 1000));
	print("Делитель напряжения Vce:\t1:" + sic_gd_vce_probe);
}

function calc(FileNumber)
{
	if(FileNumber)
		SiC_GD_SetEmuSettings(FileNumber);
	else
		sic_gd_emu = false;
	
	SiC_PrintPN();
	SiC_PrintSN();
	
	var Curves = SiC_GD_GetCurves(sic_ch_vge, sic_ch_vce, sic_ch_ice);
	SiC_Main(Curves);
}

function inf()
{
	SiC_PrintChannelInfo();
	print("");
	SiC_PrintProbeInfo();
	print("");
	SiC_PrintPN(true);
	SiC_PrintSN(true);
}

function doc()
{
	print("1. Для задания настроек осциллографа выполните scope(ComPort, ch_Vge, ch_Ice, ch_Vce)");
	print("\tComPort - номер COM-порта для подключения осциллографа");
	print("\tch_Vge - номер канала измерения Vge");
	print("\tch_Ice - номер канала измерения Ice");
	print("\tch_Vce - номер канала измерения Vce");
	print("\tНапример, scope(1, 1, 2, 3)");
	print("");
	print("2. Для задания настроек пробников выполните probe(VceProbe, IceShuntRes)");
	print("\tVceProbe - коэффициент деления пробника Vсe");
	print("\tIceShuntRes - сопротивление токового шунта Iсe в мОм");
	print("\tНапример, probe(100, 2.5)");
	print("");
	print("3. Для задания типа прибора выполните pn(PartNumber)");
	print("\tPartNumber - тип прибора в двойных кавычках");
	print("\tНапример, pn(\"MIHA-HB17FA-300N\")");
	print("");
	print("4. Для задания серийного номера прибора выполните sn(SerialNumber)");
	print("\tSerialNumber - серийный номер прибора в двойных кавычках");
	print("\tНапример, sn(\"000123\")");
	print("");
	print("5. Для запуска расчёта выполните calc()");
	print("\tскрипт автоматически определит тип СПП (ключ или диод) и режим");
	print("\tпереключения (включение или выключение) для ключа");
	print("");
	print("6. Для повторного отображжения списка COM-портов выполните pp()");
	print("");
	print("7. Для формирования сводного отчёта выполните rep()");
	print("");
	print("Изменённые настройки в пп.1-4 сохраняют актуальность до перезагрузки");
	print("расчётного скрипта или до изменения с помощью соответствующей функции.");
}

function rep()
{
	var Labels =	["PN", "SN", "--",
					"dI/dt_on", "tri", "dU/dt_on", "tfv", "Eon", "tdi_on",
					"dI/dt_off", "tfi", "Icpk", "dU/dt_off", "trv", "Eoff", "tdi_off",
					"Irm [A]", "trr", "trr1", "trr2", "Qrr", "Erec",
					"Uce_100", "Uce_max", "--",
					"dI/dt_on", "tri", "dU/dt_on", "tfv", "Eon", "tdi_on",
					"dI/dt_off", "tfi", "Icpk", "dU/dt_off", "trv", "Eoff", "tdi_off",
					"Irm [A]", "trr", "trr1", "trr2", "Qrr", "Erec",
					"Uce_100", "Uce_max"];
	
	var ReportPath = "data\\REPORT_" + SiC_GetDateStr() + ".csv";
	var Files = list("data");
	
	// load filenames with test data
	var FilesData = [];
	for (var i = 0; i < Files.length; ++i)
		if (Files[i].match(/\.txt/i) != null)
			FilesData.push(loadn(Files[i]));
	
	// compose report output
	var out = [];
	for (var i = 0; i < Labels.length; ++i)
	{
		var raw_str = Labels[i] + "\t";
		for (var j = 0; j < FilesData.length; ++j)
		{
			if (FilesData[j][i] != null)
				raw_str += FilesData[j][i];
			
			raw_str += "\t";
		}
		out.push(raw_str);
	}
	
	save(ReportPath, out);
	print("Сформирован отчёт: " + ReportPath);
}
