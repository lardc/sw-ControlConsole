function w32(Address, Value)
{
	w32d(Address, Address + 1, Value);
}
//--------------------

function w32d(AddressL, AddressH, Value)
{
	dev.w(AddressL, (Value & 0xffff));
	dev.w(AddressH, (Value >> 16) & 0xffff);
}
//--------------------

function r32(Address)
{
	return r32d(Address, Address + 1);
}
//--------------------

function r32d(AddressL, AddressH)
{
	return dev.r(AddressL) | (dev.r(AddressH) << 16);
}
//--------------------
