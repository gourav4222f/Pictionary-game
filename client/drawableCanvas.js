export function DrawableCanvas(canvas, socket, roomId) {
    this.canDraw = false;
    this.clearCanvas = () => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    let prevPosition = null;
    canvas.addEventListener("mousemove", (e) => {
        if (e.buttons !== 1 || !this.canDraw) {
            prevPosition = null;
            return;
        }

        // Get the canvas position
        const rect = canvas.getBoundingClientRect();
        const newPosition = {
            x: e.clientX - rect.left, // Use clientX and subtract the canvas's left position
            y: e.clientY - rect.top   // Use clientY and subtract the canvas's top position
        };

        if (prevPosition !== null) {
            drawLine(prevPosition, newPosition);

            socket.emit("draw", {
                start: normalizeCoordinates(prevPosition),
                end: normalizeCoordinates(newPosition),
                roomId: roomId
            });
        }

        prevPosition = newPosition;
    });
    canvas.addEventListener("mouseleave", () => prevPosition = null);

    socket.on('draw-line', (data) => {
        drawLine(toCanvasSpace(data.start), toCanvasSpace(data.end));
    });

    function drawLine(start, end) {
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    function normalizeCoordinates(position) {
        return {
            x: position.x / canvas.width,
            y: position.y / canvas.height,
        };
    }

    function toCanvasSpace(position) {
        return {
            x: position.x * canvas.width,
            y: position.y * canvas.height,
        };
    }
}

