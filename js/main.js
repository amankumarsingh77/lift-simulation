class Lift {
  constructor(id, totalFloors, buildingHeight) {
    this.id = id;
    this.currentFloor = 1;
    this.isBusy = false;
    this.totalFloors = totalFloors;
    this.buildingHeight = buildingHeight;
    this.element = this.createLiftElement();
    this.speed = 100;
  }

  createLiftElement() {
    const element = document.createElement("div");
    element.id = this.id;
    element.className = "lift";
    const floorHeight = this.buildingHeight / this.totalFloors;
    element.style.height = `${floorHeight - 10}px`;
    element.style.bottom = "0px";

    const doors = document.createElement("div");
    doors.className = "lift-doors";

    const leftDoor = document.createElement("div");
    leftDoor.className = "lift-door left";

    const rightDoor = document.createElement("div");
    rightDoor.className = "lift-door right";

    doors.appendChild(leftDoor);
    doors.appendChild(rightDoor);
    element.appendChild(doors);

    return element;
  }

  async moveTo(floor) {
    const floorHeight = this.buildingHeight / this.totalFloors;
    const currentPosition = (this.currentFloor - 1) * floorHeight;
    const targetPosition = (floor - 1) * floorHeight;
    const distance = Math.abs(targetPosition - currentPosition);
    const duration = distance / this.speed;

    this.element.style.transition = `bottom ${duration}s linear`;
    this.element.style.bottom = `${targetPosition}px`;

    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentFloor = floor;
        resolve();
      }, duration * 1000);
    });
  }

  async openDoors() {
    const leftDoor = this.element.querySelector(".lift-door.left");
    const rightDoor = this.element.querySelector(".lift-door.right");
    leftDoor.classList.add("open");
    rightDoor.classList.add("open");
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async closeDoors() {
    const leftDoor = this.element.querySelector(".lift-door.left");
    const rightDoor = this.element.querySelector(".lift-door.right");
    leftDoor.classList.remove("open");
    rightDoor.classList.remove("open");
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async performFloorOperation() {
    await this.openDoors();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await this.closeDoors();
  }
}

class LiftSystem {
  constructor(floorCount, liftCount) {
    this.floorCount = floorCount;
    this.liftCount = liftCount;
    this.lifts = [];
    this.buildingHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--building-height"
      )
    );
    this.buildingElement = document.getElementById("building");
    this.pendingCalls = new Set();
    this.occupiedFloors = new Set();
    this.initialize();
  }

  updateBuildingHeight() {
    this.buildingHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--building-height"
      )
    );
    if (isNaN(this.buildingHeight)) {
      this.buildingHeight = 400;
    }
  }

  initialize() {
    this.createFloors();
    this.createLifts();
    this.updateLiftPositions();
  }

  createFloors() {
    this.buildingElement.innerHTML = "";
    const floorHeight = this.buildingHeight / this.floorCount;

    for (let i = this.floorCount; i > 0; i--) {
      const floor = document.createElement("div");
      floor.className = "floor";
      floor.style.height = `${floorHeight}px`;

      const label = document.createElement("span");
      label.className = "floor-label";
      const buttons = document.createElement("div");
      buttons.className = "buttons";

      if (i < this.floorCount) {
        const upButton = document.createElement("button");
        upButton.className = "button up";
        upButton.textContent = "Up";
        upButton.dataset.floor = i;
        upButton.dataset.direction = "up";
        buttons.appendChild(upButton);
      }

      if (i > 1) {
        const downButton = document.createElement("button");
        downButton.className = "button down";
        downButton.textContent = "Down";
        downButton.dataset.floor = i;
        downButton.dataset.direction = "down";
        buttons.appendChild(downButton);
      }

      floor.appendChild(buttons);
      floor.appendChild(label);
      this.buildingElement.appendChild(floor);
    }
  }

  createLifts() {
    for (let i = 0; i < this.liftCount; i++) {
      const lift = new Lift(
        `lift${i + 1}`,
        this.floorCount,
        this.buildingHeight
      );
      this.lifts.push(lift);
      this.buildingElement.appendChild(lift.element);
    }
  }

  updateLiftPositions() {
    const buildingWidth = this.buildingElement.offsetWidth;
    const liftWidth =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--lift-width"
        )
      ) || 80;
    const spacing = 30;
    const totalWidth =
      this.lifts.length * liftWidth + (this.lifts.length - 1) * spacing;
    const startX = (buildingWidth - totalWidth) / 2;

    this.lifts.forEach((lift, index) => {
      lift.element.style.left = `${startX + index * (liftWidth + spacing)}px`;
      lift.element.style.width = `${liftWidth}px`;
    });
  }

  findNearestAvailableLift(floor) {
    let nearestLift = null;
    let shortestDistance = Infinity;

    for (const lift of this.lifts) {
      if (!lift.isBusy) {
        const distance = Math.abs(lift.currentFloor - floor);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestLift = lift;
        }
      }
    }

    return nearestLift;
  }

  async callLift(floor, direction) {
    const callId = `${floor}-${direction}`;
    if (this.pendingCalls.has(callId) || this.occupiedFloors.has(floor)) {
      return;
    }

    this.pendingCalls.add(callId);
    await this.processCall(floor, direction);
    this.pendingCalls.delete(callId);
  }

  async processCall(floor, direction) {
    const nearestLift = this.findNearestAvailableLift(floor);
    if (!nearestLift) {
      console.log("No available lifts");
      return;
    }

    nearestLift.isBusy = true;
    this.occupiedFloors.add(floor);

    await nearestLift.moveTo(floor);

    await nearestLift.performFloorOperation();

    this.occupiedFloors.delete(floor);
    nearestLift.isBusy = false;
  }
}

let liftSystem;

document.getElementById("initializeBtn").addEventListener("click", () => {
  const floorCount = parseInt(document.getElementById("floorCount").value);
  const liftCount = parseInt(document.getElementById("liftCount").value);

  try {
    liftSystem = new LiftSystem(floorCount, liftCount);

    document.querySelectorAll(".button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const floor = parseInt(event.target.dataset.floor);
        const direction = event.target.dataset.direction;
        liftSystem.callLift(floor, direction);
      });
    });
  } catch (error) {
    console.error("Error initializing lift system:", error.message);
    alert(
      "Error initializing lift system. Please check the console for details."
    );
  }
});

window.addEventListener("resize", () => {
  if (liftSystem) {
    liftSystem.updateBuildingHeight();
    liftSystem.updateLiftPositions();
    liftSystem.lifts.forEach((lift) => {
      lift.buildingHeight = liftSystem.buildingHeight;
    });
  }
});
