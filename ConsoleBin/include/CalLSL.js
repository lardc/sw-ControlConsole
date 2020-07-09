include("Tektronix.js");
include("TestSL.js")
include("CalGeneral.js")

//Константы
TEK = 0;
PICO = 1;
//

//Переменные
var Verify = 0;
var Osc = TEK;
//

//----------------------------------------------------------------------------------
function LSL_Cal_U_Manual_Verify(LSL_Port)
{
	Verify = 1;
	
	LSL_Cal_U_Manual(LSL_Port);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_U_Verify(LSL_Port, TekPort)
{
	Verify = 1;
	
	LSL_Cal_U(LSL_Port, TekPort);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_I_Verify(LSL_Port, TekPort, Range)
{
	Verify = 1;
	
	LSL_Cal_I(LSL_Port, TekPort, Range);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_I_Manual_Verify(LSL_Port, Range)
{
	Verify = 1;
	
	LSL_Cal_I_Manual(LSL_Port, Range);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function LSL_Cal_SetI_Verify(LSL_Port, TekPort)
{
	Verify = 1;
	
	LSL_Cal_SetI(LSL_Port, TekPort);
	
	Verify = 0;
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_U_Manual(LSL_Port)
{
	//DataTable
	REG_DUT_U 			= 198;			//Регистр измерения Utm в LSLH
	
	//Константы
	LSLH_NID			= 0;			//Nid блока LSLH
	UTM_MAX_MV 			= 4500;			//Максимальное измеряемое напряжение блоком LSLH
	UTM_MIN_MV			= 500;			//Минимально рабочее измеряемое напряжение
	N    				= 10;			//Количество точек калибровки
	TEST_CURRENT		= 1500;			
	
	
	//Переменные
	var Set_U = 0;
	var LSL_U = 0;
	var Cal_Data = [];
	var V_error = [];
	var LSL_Utm = [];
	//
	
	dev.nid(LSLH_NID);
	dev.Connect(LSL_Port);
	
	
	//Сброс калибровочных коэфф до калибровки
	if(Verify==0)
	{
		dev.w(14,0);
		dev.w(15,1000);
		dev.w(16,0);
	}
	//
	

	for(i=0;i<N;i++)
	{
		Set_U = UTM_MIN_MV + i*(UTM_MAX_MV-UTM_MIN_MV)/(N-1);
		
		print("# " + (i + 1));
		
		//Ожидание установки напряжения
		print("Set voltage (in mV): "+Set_U);
		while(!(anykey())){}
		print("----------------------------------");
		
		SL_Sin(TEST_CURRENT);
		//
		
		//Считывание измеренное значение с LSLH
		LSL_U = dev.r(REG_DUT_U);
		//
		
		//Вычисление погрешности
		V_error[i] = (Set_U-LSL_U)*100/Set_U;
		LSL_Utm[i] = Set_U;
		
		//Сохраняем данные в файл
		Cal_Data[i]=(LSL_U+";"+Set_U);
		save("data/lsl_cal_utm.csv",Cal_Data);
	}
	
	//Вывод на экран погрешности измерения
	scattern(LSL_Utm, V_error, "Voltage (in mV)", "Error (in %)", "Voltage relative error");
	//
	
	if(Verify==0)
	{
		//Вычисление корректировки
		V_corr = CGEN_GetCorrection2("lsl_cal_utm");
		
		//Сохранение калибровочных коэффициентов в память LSLH_Utm
		dev.ws(14,Math.round(V_corr[0]*1000000));
		dev.ws(15,Math.round(V_corr[1]*1000));
		dev.ws(16,Math.round(V_corr[2]));
		dev.c(200);
	}
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function LSL_Cal_U(LSL_Port,TekPort)
{
	//DataTable
	REG_DUT_U 			= 198;			//Регистр измерения Utm в LSLH
	
	//Константы
	LSLH_NID			= 0;			//Nid блока LSLH
	UTM_MAX_MV 			= 4000;			//Максимальное измеряемое напряжение блоком LSLH
	UTM_MIN_MV			= 800;			//Минимально рабочее измеряемое напряжение
	N    				= 10;			//Количество точек калибровки
	LSLPC_CURRENT_MAX	= 13000;		//Максимальный ток блока LSLPC
	UTM_R_SHUNT			= 0.375;		//Сопротивление эталонного шунта, по которому проводится калибровка, мОм
	ITM_R_SHUNT			= 0.15;			//Шунт для измерения тока
	
	
	//Переменные
	var TEK_Utm = 0;
	var LSLH_Utm = 0;
	var Current = 0;
	var dI = 0;
	var Imin = 0;
	var PICO_Utm = 0;
	var Cal_Data = [];
	var V_error = [];
	var LSL_Utm = [];
	//
	
	dev.nid(LSLH_NID);
	dev.Connect(LSL_Port);
	
	//Определение начального тока и шага измениния тока
	Imin = parseFloat(UTM_MIN_MV/UTM_R_SHUNT).toFixed(0);
	dI = parseFloat((UTM_MAX_MV-UTM_MIN_MV)/UTM_R_SHUNT/(N-1)).toFixed(0);
	//

	if(Osc == TEK)
	{
		LSL_TekInit(TekPort);
		LSL_TekCursor(1);
	}
	
	//Запись сопротивления шунта
	dev.w(4,(ITM_R_SHUNT*1000));
	//
	
	//Сброс калибровочных коэфф до калибровки
	if(Verify==0)
	{
		dev.w(14,0);
		dev.w(15,1000);
		dev.w(16,0);
	}
	//
	

	for(i=0;i<N;i++)
	{	
		//Вчисление тока
		Current = parseInt(dI*i)+parseInt(Imin);
		//
		
		//Смена вертикальный шкалы осциллографа
		if(Osc == TEK)
		{
			LSL_TekRangeChange(Current,UTM_R_SHUNT);
		}
		//
		
	
		//Формируем импульс
		print("# " + (i + 1));
		
		SL_Sin(Current);
		//
		
		//Считывание измеренное значение с LSLH
		LSLH_Utm = dev.r(REG_DUT_U);
		//
		
		//Измеряем остальные параметры
		if(Osc == PICO)
		{
			//Ожидание ввода значений с осциллографа PicoScope
			print("Enter force value (in mV):");
			PICO_Utm = Math.round(readline());
			print("----------------------------------");
			
			if (isNaN(PICO_Utm))
				break;
			
			//Вычисление погрешности
			V_error[i] = (PICO_Utm-LSLH_Utm)*100/PICO_Utm;
			LSL_Utm[i] = PICO_Utm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(LSLH_Utm+";"+PICO_Utm);
			save("data/lsl_cal_utm.csv",Cal_Data);
		}
		else
		{
			//Считывание измеренное значение с осциллографа Tektronix
			TEK_Utm = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000;
			
			//Вычисление погрешности
			V_error[i] = (TEK_Utm-LSLH_Utm)*100/TEK_Utm;
			LSL_Utm[i] = TEK_Utm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(LSLH_Utm+";"+TEK_Utm);
			save("data/lsl_cal_utm.csv",Cal_Data);
		}
		//
	}
	
	//Вывод на экран погрешности измерения
	scattern(LSL_Utm, V_error, "Voltage (in mV)", "Error (in %)", "Voltage relative error");
	//
	
	if(Verify==0)
	{
		//Вычисление корректировки
		V_corr = CGEN_GetCorrection2("lsl_cal_utm");
		
		//Сохранение калибровочных коэффициентов в память LSLH_Utm
		dev.ws(14,Math.round(V_corr[0]*1000000));
		dev.ws(15,Math.round(V_corr[1]*1000));
		dev.ws(16,Math.round(V_corr[2]));
		dev.c(200);
	}
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_I_Manual(LSL_Port, Range)
{
	//DataTable
	REG_DUT_I 			= 206;			//Регистр измерения Itm в LSLH
	
	//Константы
	LSL_NID				= 0;
	UMAX_ADC 			= 2980;
	ITM_R_SHUNT			= 0.75;
	N					= 10;
	LSL_I_MIN			= 200;
	LSL_I_MAX   		= 1500;
	TEST_CURRENT		= 1500;
	//		
	
	
	//Переменные
	var Set_U = 0;
	var Set_I = 0;
	var LSL_I = 0;
	var Cal_Data = [];
	var I_error = [];
	var LSL_Itm = [];
	var REG_K2_I_CAL = 0;
	var REG_K_I_CAL = 0;
	var REG_B_I_CAL = 0;
	//
	
	dev.nid(LSL_NID);
	dev.Connect(LSL_Port);	
	
	//Сброс старых коэффициентов
	if(Verify==0)
	{
		if(Range==0)
		{
			dev.w(17,0);
			dev.w(18,1000);
			dev.w(19,0);
			REG_K2_I_CAL = 17;
			REG_K_I_CAL = 18;
			REG_B_I_CAL = 19;
		}
		if(Range==1)
		{
			dev.w(20,0);
			dev.w(21,1000);
			dev.w(22,0);
			REG_K2_I_CAL = 20;
			REG_K_I_CAL = 21;
			REG_B_I_CAL = 22;
		}
		if(Range==2)
		{
			dev.w(23,0);
			dev.w(24,1000);
			dev.w(25,0);
			REG_K2_I_CAL = 23;
			REG_K_I_CAL = 24;
			REG_B_I_CAL = 25;
		}
	}
	//
	
	//Установка требуемого диапазона
	switch(Range)
	{
		case 0: 
		{
			dev.w(8,1);
			dev.w(9,0);
			dev.w(10,0);
			break;
		}
		case 1: 
		{
			dev.w(8,0);
			dev.w(9,1);
			dev.w(10,0);
			break;
		}
		case 2: 
		{
			dev.w(8,0);
			dev.w(9,0);
			dev.w(10,1);
			break;
		}
	}
	//
	

	for(i=0;i<N;i++)
	{
		Set_I = LSL_I_MIN + i*(LSL_I_MAX-LSL_I_MIN)/(N-1);
		Set_U = Set_I*ITM_R_SHUNT;
		
		print("# " + (i + 1));
		
		//Ожидание установки напряжения
		print("Set voltage (in mV): "+Set_U);
		while(!(anykey())){}
		print("----------------------------------");
		
		SL_Sin(TEST_CURRENT);
		//
		
		//Считывание измеренное значение с LSLH
		LSL_I = dev.r(REG_DUT_I);
		//
		
		//Вычисление погрешности
		I_error[i] = (Set_I-LSL_I)*100/(Set_I);
		LSL_Itm[i] = Set_I;
		
		//Сохраняем данные в файл
		Cal_Data[i]=(LSL_I+";"+Set_I);
		save("data/lsl_cal_itm.csv",Cal_Data);
	}
	
	//Вывод на экран погрешности измерения
	scattern(LSL_Itm, I_error, "Current (in A)", "Error (in %)", "Current relative error");
	//
	
	if(Verify==0)
	{
		//Вычисление корректировки
		I_corr = CGEN_GetCorrection2("lsl_cal_itm");
		
		//Сохранение калибровочных коэффициентов в память LSLH_Utm
		dev.ws(REG_K2_I_CAL,Math.round(I_corr[0]*1000000));
		dev.ws(REG_K_I_CAL,Math.round(I_corr[1]*1000));
		dev.ws(REG_B_I_CAL,Math.round(I_corr[2]));
		dev.c(200);
	}
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_I(LSL_Port, TekPort, Range)
{
	//DataTable
	REG_DUT_I = 206;
	
	//Переменные
	var PICO_Itm = 0;
	var TEK_Itm = 0;
	var LSLH_Itm = 0;
	var Current = 0;
	var dI = 0;
	var Imin = 0;
	var Cal_Data = [];
	var I_error = [];
	var LSL_Itm = [];
	var K2=0;
	var Imax_D2 = 0;
	var K1=0;
	var Imax_D1 = 0;
	var Imax_D0 = 0;
	
	//Константы
	LSLPC_NID			= 0;
	UMAX_ADC 			= 2980;
	ITM_R_SHUNT			= 0.75;
	LSL_I_MIN_K0		= 160;
	LSL_I_MIN_K1		= 160;
	LSL_I_MIN_K2		= 160;
	LSL_I_MAX			= 1500;
	N					= 10;
	//
	
	dev.nid(LSLPC_NID);
	dev.Connect(LSL_Port);	
	
	//Сброс старых коэффициентов
	if(Verify==0)
	{
		if(Range==0)
		{
			dev.w(17,0);
			dev.w(18,1000);
			dev.w(19,0);
		}
		if(Range==1)
		{
			dev.w(20,0);
			dev.w(21,1000);
			dev.w(22,0);
		}
		if(Range==2)
		{
			dev.w(23,0);
			dev.w(24,1000);
			dev.w(25,0);
		}
	}
	//
	
	if(Osc == TEK)
	{
		LSL_TekInit(TekPort);
		LSL_TekCursor(1);
	}
	
	
	//Запись сопротивления шунта
	dev.w(4,(ITM_R_SHUNT*1000));
	//
	
	K2 = parseFloat(dev.r(7)/1000);
	K1 = parseFloat(dev.r(6)/1000);
	
	
	
	//if(Range==2)
	//{
		//Imax_D2 = parseFloat(UMAX_ADC/K2/ITM_R_SHUNT*0.95);
		//Imin = LSL_I_MIN_K2;
		//dI = parseFloat((Imax_D2-Imin)/(N-1)).toFixed(0);
	//}
	
	if(Range==1)
	{
		Imax_D1 = parseFloat(UMAX_ADC/K1/ITM_R_SHUNT*0.95);
		Imin = LSL_I_MIN_K1;
		dI = parseFloat((Imax_D1-Imin)/(N-1)).toFixed(0);
	}
	
	//if(Range==0)
	//{
		//Imax_D0 = LSL_I_MAX;
		//Imin = parseFloat(UMAX_ADC/K1/ITM_R_SHUNT*1.05);
		//dI = parseFloat((Imax_D0-Imin)/(N-1)).toFixed(0);
	//}
	
	for(i=0;i<N;i++)
	{			
		Current = parseInt(dI*i+Imin);
		
		if(Current>LSL_I_MAX)
		{
			Current = LSL_I_MAX;
		}
	
		if(Osc == TEK)
		{
			//Смена вертикальный шкалы осциллографа
			LSL_TekRangeChange(Current,ITM_R_SHUNT);
		}
	
		//Формируем импульс
		SL_Sin(Current);
		
		if(Osc == PICO)
		{
			//Измеряем остальные параметры
			print("Enter force value (in mV):");
			PICO_Itm = Math.round(readline()/ITM_R_SHUNT);
			print("----------------------------------");

			if (isNaN(PICO_Itm))
			return;
		}
		
		//Измеряем остальные параметры
		LSLH_Itm = dev.r(REG_DUT_I);
		
		if(Osc == TEK)
		{
			TEK_Itm = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000/ITM_R_SHUNT;
		}
		//
		
		if(Osc == TEK)
		{
			I_error[i] = (TEK_Itm-LSLH_Itm)*100/TEK_Itm;
			LSL_Itm[i] = TEK_Itm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(LSLH_Itm+";"+TEK_Itm);
			save("data/lsl_cal_itm.csv",Cal_Data);
		}
		else
		{
			I_error[i] = (PICO_Itm-LSLH_Itm)*100/PICO_Itm;
			LSL_Itm[i] = PICO_Itm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(LSLH_Itm+";"+PICO_Itm);
			save("data/lsl_cal_itm.csv",Cal_Data);
		}
		//
	}
	
	if(Range==2)
	{
		scattern(LSL_Itm, I_error, "Current (in A)", "Error (in %)", "Current relative error (range 2)");

		if(Verify==0)
		{
			//Вычисление корректировки
			I_corr = CGEN_GetCorrection2("lsl_cal_itm");
			
			//Сохранение калибровочных коэффициентов в память
			dev.w(23,Math.round(I_corr[0]*1000000));
			dev.w(24,Math.round(I_corr[1]*1000));
			dev.ws(25,Math.round(I_corr[2]));
			dev.c(200);
		}
	}
	
	if(Range==1)
	{
		scattern(LSL_Itm, I_error, "Current (in A)", "Error (in %)", "Current relative error (range 1)");

		if(Verify==0)
		{
			//Вычисление корректировки
			I_corr = CGEN_GetCorrection2("lsl_cal_itm");
			
			//Сохранение калибровочных коэффициентов в память
			dev.w(20,Math.round(I_corr[0]*1000000));
			dev.w(21,Math.round(I_corr[1]*1000));
			dev.ws(22,Math.round(I_corr[2]));
			dev.c(200);
		}
	}
	
	if(Range==0)
	{
		scattern(LSL_Itm, I_error, "Current (in A)", "Error (in %)", "Current relative error (range 0)");

		if(Verify==0)
		{
			//Вычисление корректировки
			I_corr = CGEN_GetCorrection2("lsl_cal_itm");
			
			//Сохранение калибровочных коэффициентов в память
			dev.w(17,Math.round(I_corr[0]*1000000));
			dev.w(18,Math.round(I_corr[1]*1000));
			dev.ws(19,Math.round(I_corr[2]));
			dev.c(200);
		}
	}
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_Cal_SetI(LSL_Port, TekPort)
{
	//DataTable
	REG_DUT_I = 206;
	
	//Переменные
	var TEK_Itm = 0;
	var LSLH_Itm = 0;
	var Current = 0;
	var dI = 0;
	var Cal_Data = [];
	var I_error = [];
	var LSL_Itm = [];
	var Current=0;
	var Imin=0;
	
	//Константы
	LSLPC_NID					= 0;
	ITM_R_SHUNT					= 0.75;
	LSL_I_MIN					= 160;
	LSL_I_MAX					= 1500;
	N							= 10;
	//
	
	Imin = LSL_I_MIN;
	dI = parseFloat((LSL_I_MAX-Imin)/(N-1)).toFixed(0);
	
	//Сброс старых коэффициентов
	if(Verify==0)
	{
		dev.w(11,0);
		dev.w(12,1000);
		dev.w(13,0);
	}
	//
	
	dev.nid(LSLPC_NID);
	dev.Connect(LSL_Port);	
	
	if(Osc == TEK)
	{
		LSL_TekInit(TekPort);
		LSL_TekCursor(1);
	}

	
		
	for(i=0;i<N;i++)
	{			
		Current = parseInt(dI*i+Imin);
	
		if(Current>LSL_I_MAX)
		{
			Current = LSL_I_MAX;
		}

		//Смена вертикальный шкалы осциллографа
		if(Osc == TEK)
		{
			LSL_TekRangeChange(Current,ITM_R_SHUNT);
		}
	
		//Формируем импульс
		SL_Sin(Current);
		
		if(Osc == PICO)
		{
			//Измеряем остальные параметры
			print("Enter force value (in mV):");
			PICO_Itm = Math.round(readline()/ITM_R_SHUNT);
			print("----------------------------------");

			if (isNaN(PICO_Itm))
			return;
		}
		
		//Измеряем остальные параметры
		LSLH_Itm = dev.r(REG_DUT_I);
		
		if(Osc == TEK)
		{
			TEK_Itm = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000/ITM_R_SHUNT;
		}
		//
		
		if(Osc == TEK)
		{
			I_error[i] = (TEK_Itm-LSLH_Itm)*100/TEK_Itm;
			LSL_Itm[i] = TEK_Itm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(LSLH_Itm+";"+TEK_Itm);
			save("data/lsl_cal_seti.csv",Cal_Data);
		}
		else
		{
			I_error[i] = (PICO_Itm-LSLH_Itm)*100/PICO_Itm;
			LSL_Itm[i] = PICO_Itm;
			
			//Сохраняем данные в файл
			Cal_Data[i]=(LSLH_Itm+";"+PICO_Itm);
			save("data/lsl_cal_seti.csv",Cal_Data);
		}
		//
	}
	
	scattern(LSL_Itm, I_error, "Current (in A)", "Error (in %)", "Current relative error (Range 2)");
	
	if(Verify==0)
	{
		//Вычисление корректировки
		I_corr = CGEN_GetCorrection2("lsl_cal_seti");
		
		//Сохранение калибровочных коэффициентов в память
		dev.w(11,Math.round(I_corr[0]*1000000));
		dev.w(12,Math.round(I_corr[1]*1000));
		dev.ws(13,Math.round(I_corr[2]));
		dev.c(200);
	}
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function LSL_Cal_ShuntAmp(LSL_Port, TekPort)
{
	//DataTable
	REG_DUT_U = 198;
	//
	
	//Переменные
	var K_DUT_I_last = 0;
	var Ky = 0;
	
	//Константы
	LSLPC_NID			= 0;
	R_SHUNT				= 0.375;
	ADC_REF_MV			= 3000;
	//
	
	//
	dev.nid(LSLPC_NID);
	dev.Connect(LSL_Port);
	//
	
	if(Osc == TEK)
	{
		//Настройка осциллографа
		LSL_TekInit(TekPort);
		LSL_TekCursor(1);
		//
	}
	
	K_DUT_I_last = dev.r(1);
	
	//Обнуление калибровочных коэффициентов
	dev.w(1,1000);
	dev.w(9,1000);
	dev.w(10,0);
	dev.w(11,1000);
	dev.w(12,0);
	dev.w(13,1000);
	dev.w(14,0);
	dev.w(15,1000);
	dev.w(16,1000);
	dev.w(17,1000);
	//
	
//-------Определение коэффициента усиления диапазона 3-------

	//Установка диапазона осциллографа
	LSL_TEK_ChannelInit(1, 1, 0.05);
	sleep(1000);

	for(i=0;i<5;i++)
	{
		//Формирование тока 1700А
		SL_Sin(1700);
		
		//Вычисление коэффициента усиления
		Uadc_mV = parseFloat(dev.r(206)*R_SHUNT*ADC_REF_MV/4095);
		Ushunt = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000;
		Ky = parseFloat(Ky + Uadc_mV/Ushunt);
	}
	
	Ky = parseInt(Ky/5*1000);
	
	//Сохранение в память блока LSLH
	dev.w(17,Ky);
	
	print("K3 = "+Ky);
	
	Ky = 0;
//--------------------------------------------------------------

//-------Определение коэффициента усиления диапазона 2-------

	//Установка диапазона осциллографа
	LSL_TEK_ChannelInit(1, 1, 0.2);
	sleep(1000);
	
	for(i=0;i<5;i++)
	{
		//Формирование тока 6000А
		SL_Sin(6000);
		
		//Вычисление коэффициента усиления
		Uadc_mV = parseFloat(dev.r(206)*R_SHUNT*ADC_REF_MV/4095);
		Ushunt = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000;
		Ky = parseFloat(Ky + Uadc_mV/Ushunt);
	}
	
	Ky = parseInt(Ky/5*1000);
	
	//Сохранение в память блока LSLH
	dev.w(16,Ky);
	
	print("K2 = "+Ky);
	
	Ky = 0;
//--------------------------------------------------------------
	
//-------Определение коэффициента усиления диапазона 1-------

	//Установка диапазона осциллографа
	LSL_TEK_ChannelInit(1, 1, 0.5);
	sleep(1000);
	
	for(i=0;i<5;i++)
	{
		//Формирование тока 13000А
		SL_Sin(13000);
		
		//Вычисление коэффициента усиления
		Uadc_mV = parseFloat(dev.r(206)*R_SHUNT*ADC_REF_MV/4095);
		Ushunt = parseFloat(TEK_Exec("cursor:vbars:hpos1?")).toFixed(3)*1000;
		Ky = parseFloat(Ky + Uadc_mV/Ushunt);
	}
	
	Ky = parseInt(Ky/5*1000);
	
	//Сохранение в память блока LSLH
	dev.w(15,Ky);
	
	print("K1 = "+Ky);
//--------------------------------------------------------------

	dev.w(1,K_DUT_I_last);

	dev.c(200);
}
//----------------------------------------------------------------------------------





//----------------------------------------------------------------------------------
function LSL_TekRangeChange(Current, Rshunt)
{
	//Смена вертикальный шкалы осциллографа
	Tek_Vmax = Current*Rshunt/1000;
	Tek_V_Range = Tek_Vmax/7;
	
	if(Tek_V_Range<=0.002){LSL_TEK_ChannelInit(1, 1, 0.002);}
	if((Tek_V_Range>0.002)&&(Tek_V_Range<=0.005)){LSL_TEK_ChannelInit(1, 1, 0.005);}
	if((Tek_V_Range>0.005)&&(Tek_V_Range<=0.01)){LSL_TEK_ChannelInit(1, 1, 0.01);}
	if((Tek_V_Range>0.01)&&(Tek_V_Range<=0.02)){LSL_TEK_ChannelInit(1, 1, 0.02);}
	if((Tek_V_Range>0.02)&&(Tek_V_Range<=0.05)){LSL_TEK_ChannelInit(1, 1, 0.05);}
	if((Tek_V_Range>0.05)&&(Tek_V_Range<=0.1)){LSL_TEK_ChannelInit(1, 1, 0.1);}
	if((Tek_V_Range>0.1)&&(Tek_V_Range<=0.2)){LSL_TEK_ChannelInit(1, 1, 0.2);}
	if((Tek_V_Range>0.2)&&(Tek_V_Range<=0.5)){LSL_TEK_ChannelInit(1, 1, 0.5);}
	if((Tek_V_Range>0.5)&&(Tek_V_Range<=1)){LSL_TEK_ChannelInit(1, 1, 1);}
	if((Tek_V_Range>1)&&(Tek_V_Range<=2)){LSL_TEK_ChannelInit(1, 1, 2);}
	if((Tek_V_Range>2)&&(Tek_V_Range<=5)){LSL_TEK_ChannelInit(1, 1, 5);}
	if(Tek_V_Range>5){LSL_TEK_ChannelInit(1, 1, 5);}
	
	sleep(1000);
	//
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_TEK_ChannelInit(Channel, Probe, Scale)
{
	TEK_Send("ch" + Channel + ":bandwidth on");
	TEK_Send("ch" + Channel + ":coupling dc");
	TEK_Send("ch" + Channel + ":invert off");
	TEK_Send("ch" + Channel + ":position -4");
	TEK_Send("ch" + Channel + ":probe " + Probe);
	TEK_Send("ch" + Channel + ":scale " + Scale);
}
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
function LSL_TekInit(Port)
{
	//Tektronix config
	TEK_PortInit(Port);
	LSL_TEK_ChannelInit(1, 1, 0.2);//(channel,probe,scale) I dut
	LSL_TEK_ChannelInit(2, 1, 0.5);//(channel,probe,scale) U dut
	LSL_TEK_ChannelInit(3, 1, 2);//(channel,probe,scale) sync
	TEK_TriggerInit(3, 2.5);//(channel,level) sync
	TEK_Horizontal(2.5e-3, 0);//(scale,position)
}
//----------------------------------------------------------------------------------


//----------------------------------------------------------------------------------
function LSL_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 0");
}
//----------------------------------------------------------------------------------