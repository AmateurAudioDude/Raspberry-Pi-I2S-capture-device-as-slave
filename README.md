# Raspberry Pi I2S capture device as slave

### Slave mode
**Modified to be used as a capture device for I2S audio in slave mode. The device connecting to the Raspberry Pi must therefore be set to master mode.**

### Master mode
**Modified to be used as a capture device for I2S audio in master mode. The device connecting to the Raspberry Pi must therefore be set to slive mode.**

General I2S slave I/O device tree overlay for Raspberry Pi.  
Tested with Raspberry pi Compute Module 3+ and Asahi Kasei AK4556.  

- I2S slave: Raspberry pi
- I2S master: Audio codec (ex. AK4556)

## How to use (slave mode)  
Compile on Raspberry Pi  
```bash
dtc -@ -I dts -O dtb -Wno-unit_address_vs_reg -o genericstereoaudiocodec.dtbo genericstereoaudiocodec.dts
```

Copy i2smaster.dtbo to /boot/overlays  
```bash
sudo cp genericstereoaudiocodec.dtbo /boot/overlays
```

Edit /boot/config.txt  
Enable I2S and add i2smaster device tree overlay  
```/boot/config.txt    # Uncomment some or all of these to enable the optional hardware interface
#dtparam=i2c_arm=on
dtparam=i2s=on
#dtparam=spi=on
dtoverlay=genericstereoaudiocodec
```

If you don't need HDMI audio output and Raspberry Pi's headphone output, comment out "dtparam=audio=on" by hash.  
like this.  
```/boot/config.txt
#dtparam=audio=on
```




## How to use (master mode)  
Compile on Raspberry Pi  
```bash
dtc -@ -I dts -O dtb -Wno-unit_address_vs_reg -o i2s-capture-master.dtbo i2s-capture-master.dts
```

Copy i2smaster.dtbo to /boot/overlays  
```bash
sudo cp i2s-capture-master.dtbo /boot/overlays/
```

Edit /boot/config.txt  
Enable I2S and add i2smaster device tree overlay  
```/boot/config.txt    # Uncomment some or all of these to enable the optional hardware interface
#dtparam=i2c_arm=on
dtparam=i2s=on
#dtparam=spi=on
dtoverlay=i2s-capture-master
```

If you don't need HDMI audio output and Raspberry Pi's headphone output, comment out "dtparam=audio=on" by hash.  
like this.  
```/boot/config.txt
#dtparam=audio=on
```

### Only one can be active at a time in the boot config file, comment the unused capture device.
