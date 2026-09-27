// const PEN_SERVICE_UUID =
//   "12345678-1234-1234-1234-123456789abc";

// const COMMAND_UUID =
//   "12345678-1234-1234-1234-123456789abd";

// const RESPONSE_UUID =
//   "12345678-1234-1234-1234-123456789abe";

// class PenBluetooth {
//   constructor() {
//     this.device = null;
//     this.server = null;
//     this.service = null;

//     this.commandCharacteristic = null;
//     this.responseCharacteristic = null;

//     this.onMessage = null;
//   }

//   // --------------------------------
//   // CONNECT TO PEN
//   // --------------------------------
//   async connect() {
//     if (!navigator.bluetooth) {
//       throw new Error(
//         "Web Bluetooth is not supported in this browser."
//       );
//     }

//     console.log("Requesting Bluetooth device...");

//     this.device = await navigator.bluetooth.requestDevice({
//       filters: [
//         {
//           services: [PEN_SERVICE_UUID],
//         },
//       ],
//     });

//     console.log("Device selected:", this.device.name);

//     this.device.addEventListener(
//       "gattserverdisconnected",
//       () => {
//         console.log("Pen disconnected");

//         if (this.onMessage) {
//           this.onMessage({
//             type: "status",
//             message: "Pen disconnected",
//           });
//         }
//       }
//     );

//     console.log("Connecting to GATT server...");

//     this.server = await this.device.gatt.connect();

//     console.log("GATT connected");

//     this.service =
//       await this.server.getPrimaryService(
//         PEN_SERVICE_UUID
//       );

//     console.log("Service found");

//     this.commandCharacteristic =
//       await this.service.getCharacteristic(
//         COMMAND_UUID
//       );

//     this.responseCharacteristic =
//       await this.service.getCharacteristic(
//         RESPONSE_UUID
//       );

//     console.log("Characteristics found");

//     // Enable notifications
//     await this.responseCharacteristic.startNotifications();

//     this.responseCharacteristic.addEventListener(
//       "characteristicvaluechanged",
//       (event) => {
//         this.handleNotification(event);
//       }
//     );

//     console.log("Notifications enabled");

//     if (this.onMessage) {
//       this.onMessage({
//         type: "status",
//         message: "Pen connected",
//       });
//     }

//     return this.device;
//   }

//   // --------------------------------
//   // HANDLE BLE NOTIFICATION
//   // --------------------------------
//   handleNotification(event) {
//     const value = event.target.value;

//     const decoder = new TextDecoder("utf-8");

//     const message = decoder.decode(value);

//     console.log("BLE RESPONSE:", message);

//     if (this.onMessage) {
//       this.onMessage({
//         type: "ble",
//         message: message,
//       });
//     }
//   }

//   // --------------------------------
//   // SEND COMMAND
//   // --------------------------------
//   async sendCommand(command) {
//     if (!this.commandCharacteristic) {
//       throw new Error("Pen is not connected.");
//     }

//     console.log("Sending command:", command);

//     const encoder = new TextEncoder();

//     const data = encoder.encode(command);

//     await this.commandCharacteristic.writeValue(data);

//     console.log("Command sent");
//   }

//   // --------------------------------
//   // ASK PEN FOR RECORDINGS
//   // --------------------------------
//   async listRecordings() {
//     await this.sendCommand("LIST");
//   }

//   // --------------------------------
//   // DISCONNECT
//   // --------------------------------
//   disconnect() {
//     if (
//       this.device &&
//       this.device.gatt &&
//       this.device.gatt.connected
//     ) {
//       this.device.gatt.disconnect();
//     }

//     this.device = null;
//     this.server = null;
//     this.service = null;

//     this.commandCharacteristic = null;
//     this.responseCharacteristic = null;
//   }

//   // --------------------------------
//   // CHECK CONNECTION
//   // --------------------------------
//   isConnected() {
//     return (
//       this.device &&
//       this.device.gatt &&
//       this.device.gatt.connected
//     );
//   }
// }

// export default PenBluetooth;


const PEN_SERVICE_UUID =
  "12345678-1234-1234-1234-123456789abc";

const COMMAND_UUID =
  "12345678-1234-1234-1234-123456789abd";

const RESPONSE_UUID =
  "12345678-1234-1234-1234-123456789abe";


class PenBluetooth {

  constructor() {

    this.device = null;

    this.server = null;

    this.service = null;

    this.commandCharacteristic = null;

    this.responseCharacteristic = null;

    this.onMessage = null;

    // BLE characteristic writes must be serialized. Overlapping ACK/NACK
    // writes can make the pen stop a transfer early.
    this.commandWriteChain = Promise.resolve();


    // ---------------------------------------------
    // File transfer state
    // ---------------------------------------------

    this.fileTransfer = null;
  }


  // =================================================
  // CONNECT
  // =================================================

  async connect() {

    if (!navigator.bluetooth) {

      throw new Error(
        "Web Bluetooth is not supported in this browser."
      );
    }


    console.log(
      "Requesting Bluetooth device..."
    );


    this.device =
      await navigator.bluetooth.requestDevice({

        filters: [
          {
            services: [
              PEN_SERVICE_UUID
            ]
          }
        ]

      });


    console.log(
      "Device selected:",
      this.device.name
    );


    this.device.addEventListener(
      "gattserverdisconnected",
      () => {

        console.log(
          "Pen disconnected"
        );


        if (this.onMessage) {

          this.onMessage({
            type: "status",
            message: "Pen disconnected"
          });

        }

      }
    );


    this.server =
      await this.device.gatt.connect();


    console.log(
      "GATT connected"
    );


    this.service =
      await this.server.getPrimaryService(
        PEN_SERVICE_UUID
      );


    this.commandCharacteristic =
      await this.service.getCharacteristic(
        COMMAND_UUID
      );


    this.responseCharacteristic =
      await this.service.getCharacteristic(
        RESPONSE_UUID
      );


    // ---------------------------------------------
    // Enable notifications
    // ---------------------------------------------

    await this.responseCharacteristic
      .startNotifications();


    this.responseCharacteristic.addEventListener(
      "characteristicvaluechanged",
      (event) => {

        this.handleNotification(
          event
        );

      }
    );


    console.log(
      "Notifications enabled"
    );


    if (this.onMessage) {

      this.onMessage({
        type: "status",
        message: "Pen connected"
      });

    }


    return this.device;
  }


  // =================================================
  // HANDLE NOTIFICATION
  // =================================================

  handleNotification(event) {

    const value =
      event.target.value;


    const bytes =
      new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
      );


    // ---------------------------------------------
    // Check whether this is our binary packet
    //
    // First two bytes:
    //
    // T P
    // ---------------------------------------------

    if (
      bytes.length >= 8 &&
      bytes[0] === 84 &&
      bytes[1] === 80
    ) {

      this.handleFileChunk(
        bytes
      );

      return;
    }


    // ---------------------------------------------
    // Otherwise this is a normal text message
    // ---------------------------------------------

    const decoder =
      new TextDecoder("utf-8");


    const message =
      decoder.decode(
        bytes
      );


    console.log(
      "BLE RESPONSE:",
      message
    );


    if (this.onMessage) {

      this.onMessage({
        type: "ble",
        message: message
      });

    }
  }


  // =================================================
  // HANDLE BINARY FILE CHUNK
  // =================================================

// =================================================
// HANDLE BINARY FILE CHUNK
// =================================================

handleFileChunk(bytes) {

    if (!this.fileTransfer) {

      console.error(
        "Received chunk without active transfer"
      );

      return;
    }


    const view =
      new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength
      );


    // ------------------------------------------------
    // Read chunk number
    // ------------------------------------------------

    const chunkNumber =
      view.getUint32(
        2,
        true
      );


    // ------------------------------------------------
    // Read data length
    // ------------------------------------------------

    const dataLength =
      view.getUint16(
        6,
        true
      );


    // ------------------------------------------------
    // Validate packet length
    // ------------------------------------------------

    if (
      bytes.length <
      8 + dataLength
    ) {

      console.error(
        "Invalid packet length"
      );

      return;
    }


    // ------------------------------------------------
    // Extract audio data
    // ------------------------------------------------

    const data =
      bytes.slice(
        8,
        8 + dataLength
      );


    console.log(
      "RECEIVED CHUNK:",
      chunkNumber,
      "BYTES:",
      data.length
    );


    const transfer =
      this.fileTransfer;


    // =================================================
    // EXPECTED CHUNK
    // =================================================

    if (
      chunkNumber ===
      transfer.expectedChunk
    ) {

      // ----------------------------------------------
      // Store chunk
      // ----------------------------------------------

      transfer.chunks.push(
        data
      );


      transfer.receivedBytes +=
        data.length;


      transfer.lastChunk =
        chunkNumber;


      transfer.expectedChunk =
        chunkNumber + 1;


      // ----------------------------------------------
      // Progress
      // ----------------------------------------------

      if (
        transfer.onProgress
      ) {

        transfer.onProgress({

          receivedBytes:
            transfer.receivedBytes,

          totalBytes:
            transfer.totalBytes,

          chunkNumber:
            chunkNumber

        });
      }


      // ----------------------------------------------
      // Send cumulative ACK
      //
      // We ACK every WINDOW_SIZE chunks.
      // ----------------------------------------------

      const isWindowEnd =
        (
          (chunkNumber + 1) %
          transfer.windowSize
        ) === 0;


      if (
        isWindowEnd
      ) {

        this.sendCommand(
          "ACK:" + chunkNumber
        );

        transfer.lastAckSent =
          chunkNumber;

      }


      // ----------------------------------------------
      // Last chunk
      //
      // ACK it even if the file doesn't end exactly
      // on a window boundary.
      // ----------------------------------------------

      if (
        transfer.receivedBytes >= transfer.totalBytes &&
        transfer.lastAckSent !== chunkNumber
      ) {

        this.sendCommand(
          "ACK:" + chunkNumber
        );

        transfer.lastAckSent =
          chunkNumber;
      }


      return;
    }


    // =================================================
    // DUPLICATE CHUNK
    // =================================================

    if (
      chunkNumber <
      transfer.expectedChunk
    ) {

      console.warn(
        "Duplicate chunk:",
        chunkNumber
      );


      // ACK the latest correctly received chunk

      const lastCorrectChunk =
        transfer.expectedChunk - 1;


      this.sendCommand(
        "ACK:" + lastCorrectChunk
      );


      return;
    }


    // =================================================
    // MISSING CHUNK
    // =================================================

    if (
      chunkNumber >
      transfer.expectedChunk
    ) {

      console.warn(
        "Missing chunk!",
        "Expected:",
        transfer.expectedChunk,
        "Received:",
        chunkNumber
      );


      // ----------------------------------------------
      // Tell ESP32 which chunk is missing
      // ----------------------------------------------

      this.sendCommand(
        "NACK:" +
        transfer.expectedChunk
      );


      transfer.lastNackSent =
        transfer.expectedChunk;
    }
  }

  // =================================================
  // SEND COMMAND
  // =================================================

  async sendCommand(command) {

    if (
      !this.commandCharacteristic
    ) {

      throw new Error(
        "Pen is not connected."
      );
    }


    console.log(
      "Sending command:",
      command
    );


    const encoder =
      new TextEncoder();


    const data =
      encoder.encode(
        command
      );


    const write = this.commandWriteChain
      .catch(() => {})
      .then(() => this.commandCharacteristic.writeValue(data));

    this.commandWriteChain = write.catch(() => {});
    await write;


    console.log(
      "Command sent"
    );
  }


  // =================================================
  // LIST RECORDINGS
  // =================================================

  async listRecordings() {

    await this.sendCommand(
      "LIST"
    );
  }

  // =================================================
  // DOWNLOAD COMPLETE FILE
  // =================================================

  async downloadFile(filename, onProgress) {

    return new Promise(
      (resolve, reject) => {

        // -----------------------------------------
        // Create transfer state
        // -----------------------------------------

      this.fileTransfer = {

        filename: filename,

        totalBytes: 0,

        receivedBytes: 0,

        chunks: [],

        lastChunk: -1,

        expectedChunk: 0,

        totalChunks: 0,

        windowSize: 6,

        lastAckSent: -1,

        lastNackSent: -1,

        onProgress: onProgress,

        resolve: resolve,

        reject: reject
      };


        // -----------------------------------------
        // Temporarily handle normal BLE messages
        // -----------------------------------------

        const previousHandler =
          this.onMessage;


        this.onMessage = (data) => {

          if (
            data.type !== "ble"
          ) {

            if (previousHandler) {

              previousHandler(data);

            }

            return;
          }


          const message =
            data.message.trim();


          console.log(
            "TRANSFER MESSAGE:",
            message
          );


          // ---------------------------------------
          // START
          //
          // START:REC001.wav:327684
          // ---------------------------------------

          if (
            message.startsWith(
              "START:"
            )
          ) {

            const parts =
              message.split(":");


            const size =
              Number(
                parts[parts.length - 1]
              );


            this.fileTransfer.totalBytes =
              size;


            console.log(
              "Transfer started:",
              size,
              "bytes"
            );



            return;
          }


          // ---------------------------------------
          // END
          // ---------------------------------------

          if (
            message === "END"
          ) {

            console.log(
              "Transfer END received"
            );


            const transfer =
              this.fileTransfer;


            if (
              transfer.receivedBytes !==
              transfer.totalBytes
            ) {

              console.error(
                "SIZE MISMATCH",
                transfer.receivedBytes,
                transfer.totalBytes
              );


              this.onMessage =
                previousHandler;


              this.fileTransfer =
                null;


              reject(
                new Error(
                  "File transfer incomplete. Received " +
                  transfer.receivedBytes +
                  " of " +
                  transfer.totalBytes +
                  " bytes."
                )
              );


              return;
            }


            // -----------------------------------
            // Combine chunks
            // -----------------------------------

            const blob =
              new Blob(
                transfer.chunks,
                {
                  type: "audio/wav"
                }
              );


            console.log(
              "WAV CREATED:",
              blob.size,
              "bytes"
            );


            this.onMessage =
              previousHandler;


            this.fileTransfer =
              null;


            resolve(
              blob
            );


            return;
          }


          // ---------------------------------------
          // ERROR
          // ---------------------------------------

          if (
            message.startsWith(
              "ERROR:"
            )
          ) {

            this.onMessage =
              previousHandler;


            this.fileTransfer =
              null;


            reject(
              new Error(
                message
              )
            );
          }

        };


        // -----------------------------------------
        // Request file
        // -----------------------------------------

        this.sendCommand("GET:" + filename).catch((error) => {

          this.onMessage =
            previousHandler;

          this.fileTransfer =
            null;

          reject(
            error
          );
        });

      }
    );
  }


  // =================================================
  // DISCONNECT
  // =================================================

  disconnect() {

    if (
      this.device &&
      this.device.gatt &&
      this.device.gatt.connected
    ) {

      this.device.gatt.disconnect();

    }


    this.device = null;

    this.server = null;

    this.service = null;

    this.commandCharacteristic = null;

    this.responseCharacteristic = null;
  }


  // =================================================
  // CONNECTION STATUS
  // =================================================

  isConnected() {

    return (
      this.device &&
      this.device.gatt &&
      this.device.gatt.connected
    );
  }

}


export default PenBluetooth;

