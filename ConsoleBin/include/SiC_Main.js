include("SiC_Calc.js")

sic_device_name = "NONE";

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
		print("Режим ключа:\t" + (OnMode ? "включение" : "выключение"));
	out_data.push("---");
	out_data.push("V" + ":\t\t" + RiseFallData.V_points.S_amp.toFixed(0) + "\t (V)");
	out_data.push("Vmax" + ":\t\t" + RiseFallData.V_points.S_max.toFixed(0) + "\t (V)");
	out_data.push("---");
	out_data.push("I" + ":\t\t" + RiseFallData.I_points.S_amp.toFixed(0) + "\t (A)");
	out_data.push("Imax" + ":\t\t" + RiseFallData.I_points.S_max.toFixed(0) + "\t (A)");
	out_data.push("---");
	
	if (!IsDiode)
	{
		out_data.push("dI/dt_" + (OnMode ? "on" : "off") + ":\t" + RiseFallData.I_points.S_rf.toFixed(0) + "\t (A/us)");
		out_data.push("t" + (OnMode ? "r" : "f") + "i:\t\t" + RiseFallData.I_points.t_rf.toFixed(0) + "\t (ns)");
		if (!IsHigh)
			out_data.push("tdi_" + (OnMode ? "on: " : "off:") + "\t" + SiC_CALC_Delay(Curves).toFixed(0) + "\t (ns)");
		out_data.push("---");
		out_data.push("dU/dt_" + (OnMode ? "on" : "off") + ":\t" + RiseFallData.V_points.S_rf.toFixed(0) + "\t (V/us)");
		out_data.push("t" + (OnMode ? "f" : "r") + "v:\t\t" + RiseFallData.V_points.t_rf.toFixed(0) + "\t (ns)");
		out_data.push("E_" + (OnMode ? "on" : "off") + ":\t\t" + SiC_CALC_Energy(Curves).Energy.toFixed(0) + "\t (mJ)");
	}
	
	if (OnMode || IsDiode)
	{
		var Recovery = SiC_CALC_Recovery(Curves, IsDiode);
		
		if (!IsDiode)
			out_data.push("---");
		out_data.push("Irrm" + ":\t\t" + Recovery.Irrm.toFixed(0) + "\t (A)");
		out_data.push("trr" + ":\t\t" + Recovery.trr.toFixed(0) + "\t (ns)");
		out_data.push("Qrr" + ":\t\t" + Recovery.Qrr.toFixed(0) + "\t (uC)");
		out_data.push("E_rec" + ":\t\t" + Recovery.Energy.toFixed(1) + "\t (mJ)");
	}
	
	for (var  i = 0; i < out_data.length; ++i)
		print(out_data[i]);
	
	// compose file name and save
	var FileName = sic_device_name + "_" + (IsHigh ? "HIGH" : "LOW") + "_" + (IsDiode ? "DIODE" : "KEY");
	if (!IsDiode)
		FileName += "_" + (OnMode ? "ON" : "OFF");
	// add current
	FileName += "_" + RiseFallData.I_points.S_amp.toFixed(0) + "A";
	// add voltage
	FileName += "_" + RiseFallData.V_points.S_amp.toFixed(0) + "V";
	FileName += "_" + (new Date()).toISOString().slice(0, 19).replace(/[\-:]/g, "").replace("T", "_") + ".txt";
	FileName = "data\\" + FileName;
	
	save(FileName, out_data);
	print("\nСохранено в файл:");
	print(FileName);
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

function name(DeviceName)
{
	sic_device_name = DeviceName;
	SiC_PrintDeviceName();
}

function SiC_PrintDeviceName()
{
	print("Текущее имя прибора:\t\t" + sic_device_name);
}

function scope(ComPort, ch_Vge, ch_Ice, ch_Vce)
{
	sic_ch_vge = ch_Vge;
	sic_ch_ice = ch_Ice;
	sic_ch_vce = ch_Vce;
	
	SiC_GD_Init(ComPort);
	
	print("Идентификатор осциллографа: " + TEK_Exec("id?") + "\n");
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

function calc()
{
	print("Имя прибора:\t" + sic_device_name);
	print("Для продолжения нажмите \"y\". Для отмены нажмите любую другую клавишу.");
	var k = readkey();
	if (k == "y")
	{
		var Curves = SiC_GD_GetCurves(sic_ch_vge, sic_ch_vce, sic_ch_ice);
		SiC_Main(Curves);
	}
}

function inf()
{
	SiC_PrintChannelInfo();
	print("")
	SiC_PrintProbeInfo();
	print("")
	SiC_PrintDeviceName();
}

function doc()
{
	print("1. Для задания настроек осциллографа выполните scope(ComPort, ch_Vge, ch_Ice, ch_Vce)");
	print("\tComPort - номер COM-порта для подключения осциллографа");
	print("\tch_Vge - номер канала измерения Vge");
	print("\tch_Ice - номер канала измерения Ice");
	print("\tch_Vce - номер канала измерения Vce");
	print("\tНапример, scope(1, 1, 2, 3)");
	print("")
	print("2. Для задания настроек пробников выполните probe(VceProbe, IceShuntRes)");
	print("\tVceProbe - коэффициент деления пробника Vсe");
	print("\tIceShuntRes - сопротивление токового шунта Iсe в мОм");
	print("\tНапример, probe(100, 2.5)");
	print("")
	print("3. Для задания имени прибора выполните name(DeviceName)");
	print("\tDeviceName - имя прибора в двойных кавычках");
	print("\tНапример, name(\"MIXM Cu 150 C 0_5 Ohm\")");
	print("")
	print("4. Для запуска расчёта выполните calc()");
	print("\tскрипт автоматически определит тип СПП (ключ или диод) и режим");
	print("\tпереключения (включение или выключение) для ключа");
	print("");
	print("5. Для повторного отображжения списка COM-портов выполните pp()");
	print("");
	print("Изменённые настройки в пп.1-3 сохраняют актуальность до перезагрузки");
	print("расчётного скрипта или до изменения с помощью соответствующей функции.");
}
