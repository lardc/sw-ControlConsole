include("PrintStatus.js")

//Команды SCPC
ACT_BAT_START_CHARGE                    = 1;               //Команда блоку LSLPowerCell на заряд батареи конденсаторов
ACT_DS_NONE                             = 2;               //Переход в состояние ожидания

ACT_FAULT_CLEAR                         = 3;               //Очистка fault
ACT_WARNING_CLEAR                       = 4;               //Очистка warning
ACT_RESET_DEVICE                        = 5;               //Перезапуск процессора
//-----------
ACT_PULSE_CONFIG                     	= 100;             //Команда блоку LSLPowerCell на конфигурацию значения ударного тока
ACT_PULSE_START                      	= 101;             //Запуск формирования импульса ударного тока
//

//Регистры SCPC
REG_PULSE_OFFSET_VALUE                  = 0;               //Значение смещения сигнала импульса ударного тока (сигнал с ЦАПа)
REG_REGULATOR_OFFSET_VALUE              = 1;               //Значение смещения сигнала регулятора
REG_BAT_VOLTAGE_COEF                    = 2;               //Калибровочный коэффициент напряжения конденсаторной батареи
REG_BAT_VOLTAGE_THRESHOLD               = 3;               //Порог заряда конденсаторной батареи
REG_PULSE_COEF                       	= 4;               //Калибровочный коэффициент амплитуды импульса ударного тока
REG_REGULATOR_OFFSET_VAR                = 5;               //Коэффициент изменения значения REGULATOR_OFFSET_VALUE, от амплитуды импульса тока
//---------------
REG_PULSE_VALUE                      	= 64;              //Значение амплитуды импульса ударного тока, Ампер
REG_TEST_REGULATOR						= 67;			   //Режим работы блока: 1-тест регулятора, 2-обычный режим
//---------------
REG_BAT_VOLTAGE                         = 101;              //Напряжение на конденсаторной батарее, Вольт
REG_DEV_STATE                           = 96;              //Статус работы блока
REG_FAULT_REASON                        = 97;
REG_DISABLE_REASON                      = 98;
REG_WARNING                             = 99;
REG_PROBLEM                             = 100;
//---------------
//

//Ошибки SCPC
ERR_SYNC_TIMEOUT                        = 1;               //Превышено время нахождения линии SYNC в высоком состоянии
ERR_PULSE_VALUE                      	= 2;               //Неправильное значение установленного тока
ERR_UNIT_NOT_CONFIGURED                 = 3;               //Блок не сконфигурирован под заданное значение ударного тока
//

//Предупреждения SCPC
WARNING_UINIT_NOT_READY                 = 1;               //Блок еще не готов к работе
//

//Состояние блока

//Основные состояния
DS_None                                       = 0;                            //Блок в неопределенном состоянии
DS_Fault                                      = 1;                            //Блок в состоянии Fault
DS_Disabled                                   = 2;                            //Блок в состоянии Disabled
DS_BatteryCharging                            = 3;                            //Блок в состоянии заряда конденсаторной батареи
DS_PowerReady                                 = 4;                            //Блок в состоянии готовности
DS_InProcess                                  = 5;                            //Блок в процессе формирования импульса

//Дополнительные внутренние состояния
DS_WaitTimeOut                                = 6;                            //Блок в ожидании таймаута между импульсами ударного тока
DS_PulseConfigReady                           = 7;                            //Блок в в сконфигурированном состоянии
DS_PulseStart                                 = 8;                            //Блок в состоянии формирования импульса ударного тока
//



//-----------------------------------------------------------
function LSLPC_Pulse(Current)
{
	//Заряд батареи
	if(dev.r(REG_DEV_STATE)==DS_None)
	{
		dev.c(ACT_BAT_START_CHARGE);
	}
	
	while(dev.r(REG_DEV_STATE)!=DS_PowerReady){if(Print_FaultDisableWarning()){return;}}

	//Запись значения ударного тока
	dev.w(REG_PULSE_VALUE, Current);
	dev.c(ACT_PULSE_CONFIG);
	while(dev.r(REG_DEV_STATE)!=DS_PulseConfigReady)
	{
		sleep(1000);
		if(Print_FaultDisableWarning()){return;}
	}
	
	//Формирование ударного тока
	dev.c(ACT_PULSE_START);
	sleep(20);
	while(dev.r(REG_DEV_STATE)==DS_PulseStart)
	{
		if(Print_FaultDisableWarning()){return;}
	}
}

//-----------------------------------------------------------


//-----------------------------------------------------------
function LSLPC_Info()
{
	PrintStatus();
	print("\nVoltage:\t" + (dev.r(101) / 10));
}
//------------------------------------------------------------


//-----------------------------------------------------------
function LSLPC_Plot()
{
	for (var j = 1; j <= 4; ++j)
	{
		plot(dev.rafs(j), 1, 0);
		sleep(2000);
	}
}
//------------------------------------------------------------


//-----------------------------------------------------------
function Print_FaultDisableWarning()
{
	if((dev.r(REG_DEV_STATE)==DS_Fault))
	{
		switch(dev.r(REG_FAULT_REASON))
		{
			case ERR_SYNC_TIMEOUT:
			{
				print("Fault=ERR_SYNC_TIMEOUT");
			}
			case ERR_SC_PULSE_VALUE:
			{
				print("Fault=ERR_SC_PULSE_VALUE");
			}
			case ERR_UNIT_NOT_CONFIGURED:
			{
				print("Fault=ERR_UNIT_NOT_CONFIGURED");
			}
		}
		return 1;
	}
//---------------	
	if(dev.r(REG_DEV_STATE)==DS_Disabled)
	{
		print("Disable="+dev.r(REG_DISABLE_REASON));
		return 1;
	}
//--------------	
	if(dev.r(REG_WARNING)==DS_Disabled)
	{
		if(dev.r(REG_WARNING)==WARNING_UINIT_NOT_READY)
		{
			print("Disable=WARNING_UINIT_NOT_READY");
		}
		else
		{
			print("Disable=Unknow");
		}
	}	
//-------------
	return 0;
}
//------------------------------------------------------------

// LSLPC 2.0
function LSLPC_Start(Current)
{
	dev.w(128, Current * 10);
	dev.c(100);
	
	while(dev.r(192) != 4)
	{
		sleep(50);
		
		if(dev.r(192) == 1)
		{
			PrintStatus();
			return false;
		}
	}
	
	dev.c(101);
	
	sleep(20);
	
	while(dev.r(192) != 3)
	{
		sleep(50);
		
		if(dev.r(192) == 1)
		{
			PrintStatus();
			return false;
		}
	}
	
	return true;
}
//--------------------------

function LSLPC_Pulses(Current, N)
{
	for(i = 0; i < N; i++)
	{
		print("#" + i);
		LSLPC_Start(Current);
		
		if(anykey())
			break;
	}
}
//--------------------------




