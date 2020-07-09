function FWUpdateSTM(FileName)
{
	// Команды
	var ACT_DEVICE_RESET = 320;				// Команда перезапуска процессора
	var ACT_FLASH_ERASE = 300;				// Команда на очистку FLASH памяти процессора
	var ACT_ALL_VARIABLES_RESET = 301;		// Очитска всех переменных
	var ACT_PROGRAMM_DATA = 302;			// Команда на запись данных во FLASH память процессора
	var ACT_CRC_CHECK_AND_RESET = 303;		// Проверить CRC MCU и PC и перезагрузить процессор

	// Адреса регистров
	var REG_BYTE_NUM = 2;					// Регистр количества байт
	var REG_XOR_PC = 3;						// Регистр контрольной суммы PC
	var REG_XOR_MCU = 10;					// Регистр контрольной суммы MCU

	var fl_array = loadbin(FileName);
	var LocalIndex = 0;						// Текущий индекс блока записываемых данных
	var BLOCK_SIZE = 512;					// Количество записываемых данных
	var ArrayIndex = 0;						// Текущий индекс массива
	var Word_H = 0;							// Старшая часть слова ячейки памяти
	var Word_L = 0;							// Младшая часть слова ячейки памяти
	var WriteBuffer = [];					// Буфер передачи
	var Progress = 0;						// Процесс программирования (проценты на экране)
	var XOR = 0;							// XOR контрольная сумма

	print("Device reset.");
	dev.c(ACT_DEVICE_RESET);
	sleep(2000);
	//
	print("Erasing memory...");
	dev.c(ACT_FLASH_ERASE);
	print("The memory has been cleared!");
	//
	dev.c(ACT_ALL_VARIABLES_RESET);

	while (ArrayIndex < fl_array.length)
	{

		// Отображение процесса на экране
		if (ArrayIndex > ((fl_array.length / 10) * Progress))
		{
			print((Progress * 10) + "%");
			Progress++;
		}
		//

		// Отправка блока
		if ((fl_array.length - ArrayIndex) >= BLOCK_SIZE * 2)
		{
			while (LocalIndex < BLOCK_SIZE)
			{
				Word_L = fl_array[ArrayIndex] << 8;
				Word_L |= fl_array[ArrayIndex + 1];

				Word_H = fl_array[ArrayIndex + 2] << 8;
				Word_H |= fl_array[ArrayIndex + 3];

				WriteBuffer[LocalIndex] = Word_L;
				WriteBuffer[LocalIndex + 1] = Word_H;

				XOR ^= WriteBuffer[LocalIndex];
				XOR ^= WriteBuffer[LocalIndex + 1];

				ArrayIndex += 4;
				LocalIndex += 2;
			}
			dev.w(REG_BYTE_NUM, LocalIndex);		// Передача количество байт
			dev.wa(1, WriteBuffer);					// Передача данных
			dev.c(ACT_PROGRAMM_DATA);				// Отправка команды на запись данных во FLASH память процессора
			LocalIndex = 0;
		}
		else // Передача оставшихся байт
		{
			WriteBuffer = [];
			
			while (ArrayIndex < fl_array.length)
			{
				Word_L = fl_array[ArrayIndex] << 8;
				Word_L |= fl_array[ArrayIndex + 1];

				Word_H = fl_array[ArrayIndex + 2] << 8;
				Word_H |= fl_array[ArrayIndex + 3];

				WriteBuffer[LocalIndex] = Word_L;
				WriteBuffer[LocalIndex + 1] = Word_H;

				XOR ^= WriteBuffer[LocalIndex];
				XOR ^= WriteBuffer[LocalIndex + 1];

				ArrayIndex += 4;
				LocalIndex += 2;
			}

			dev.w(REG_BYTE_NUM, LocalIndex);
			dev.wa(1, WriteBuffer);
			dev.c(ACT_PROGRAMM_DATA);
			LocalIndex = 0;
		}
	}

	// Если контрольные суммы PC и MCU совпали, то
	// процесс перепрограммирования прошел успешно
	if (XOR == dev.r(REG_XOR_MCU))
	{
		print("100%");
		print("Checksum OK");
		dev.w(REG_XOR_PC, XOR);
		dev.c(ACT_CRC_CHECK_AND_RESET);
	}
	else
	{
		print("Checksum missmatch, process aborted");
		print("CRC PC = " + XOR);
		print("CRC MCU = " + dev.r(REG_XOR_MCU));

		print("Erasing memory...");
		dev.c(ACT_FLASH_ERASE);
		print("The memory has been cleared!");
	}
}

// LSLH
function FWU_LSLH(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdateSTM("../../../../../../../Static Losses/LSLH/Controller soft/Version " + Version + "/Soft/Debug/Exe/LSLH.bin");
}

function FWU_DumpLSLH(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Static Losses/LSLH/Controller soft/Version " + Version + "/Soft/lslh.regdump", 0, 126);
}

function FWU_RestoreLSLH(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Static Losses/LSLH/Controller soft/Version " + Version + "/Soft/lslh.regdump");
}
//------------------------

// LSLPC
function FWU_LSLPC(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdateSTM("../../../../../../../Static Losses/LSLPC/Controller soft/Version " + Version + "/Soft/Debug/Exe/LSLPowerCell.bin");
}

function FWU_DumpLSLPC(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Static Losses/LSLPC/Controller soft/Version " + Version + "/Soft/lslpc.regdump", 0, 62);
}

function FWU_RestoreLSLPC(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Static Losses/LSLPC/Controller soft/Version " + Version + "/Soft/lslpc.regdump");
}
//------------------------

function FWU_SCH()
{
	FWUpdateSTM("../../../../../../../Surge Current Test Unit/SCH/Controller soft/Version 2.0/SCHead/Soft/Debug/Exe/SCHead.bin");
}

function FWU_SCPC()
{
	FWUpdateSTM("E:/proton/Test equipment/Surge Current Test Unit/SCPC/Controller soft/Version 1.1/Soft/Debug/Exe/SCPowerCell.bin");
}

function FWU_SCPC2()
{
	FWUpdateSTM("../../../../../../../Surge Current Test Unit/SCPC/Controller soft/Version 2.0/Soft/Debug/Exe/SCPowerCell.bin");
}

function FWU_ATUold()
{
	FWUpdateSTM("../../../../../../../Avalanche Test Unit/Controller soft/Version 2.0 - ATU HP/Soft/Debug/Exe/ATU.bin");
}

// QPU
function FWU_QPU()
{
	FWUpdateSTM("../../../../../../../QRR Tester/QPU LP/Controllers Soft/Version 1.0/QrrtqCurrentControlBoard/Debug/Exe/QrrtqCurrentControlBoard.bin");
}

function FWU_DumpQPU()
{
	dev.Dump("../../../../../../../QRR Tester/QPU LP/Controllers Soft/Version 1.0/QrrtqCurrentControlBoard/qpu.regdump", 0, 62);
}

function FWU_RestoreQPU()
{
	dev.Restore("../../../../../../../QRR Tester/QPU LP/Controllers Soft/Version 1.0/QrrtqCurrentControlBoard/qpu.regdump");
}
//------------------------

// TOMU
function FWU_TOMU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdateSTM("../../../../../../../Turn On Unit/Controller soft/Version " + Version + "/TOMUControlBoard/Release/TOMUControlBoard.binary");
}

function FWU_DumpTOMU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Turn On Unit/Controller soft/Version " + Version + "/TOMUControlBoard/tomu.regdump", 0, 126);
}

function FWU_RestoreTOMU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Turn On Unit/Controller soft/Version " + Version + "/TOMUControlBoard/tomu.regdump");
}
//------------------------

// ATU
function FWU_ATU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdateSTM("../../../../../../../Avalanche Test Unit/Controller soft/Version " + Version + "/ATUControlBoard/Release/ATUControlBoard.binary");
}

function FWU_DumpATU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Dump("../../../../../../../Avalanche Test Unit/Controller soft/Version " + Version + "/ATUControlBoard/atu.regdump", 0, 62);
}

function FWU_RestoreATU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		dev.Restore("../../../../../../../Avalanche Test Unit/Controller soft/Version " + Version + "/ATUControlBoard/atu.regdump");
}
//------------------------

// DCU RCU
function FWU_DRCU(Version)
{
	if (typeof Version == 'undefined')
	{
		print("Error. Define software version.");
		return;
	}
	else
		FWUpdateSTM("../../../../../../../Qrr tq/DCU/Controller Soft/Version " + Version + "/DRCUControlBoard/Release/DRCUControlBoard.binary");
}
//------------------------