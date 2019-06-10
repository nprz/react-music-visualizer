import React, { useState, useRef, useEffect } from "react";
import { IoIosPlay, IoIosPause } from "react-icons/io";

// style
import styled from "styled-components";
import { fontSize, primary, mediaQueries } from "./style/fonts";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const StyledInput = styled.input`
  display: none;
`;

const StyledLabel = styled.label`
  margin: 16px 0px;
  border: 1px solid black;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: black;
  background-color: white;
  transition: color 0.25s, background-color 0.25s;

  &:hover {
    color: white;
    background-color: black;
  }
`;

const VisualizerControls = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const UploadAndTitle = styled.div`
  display: flex;
`;

const FileName = styled.div`
  font-size: ${fontSize.sm};
  line-height: 20px;
  margin-left: 16px;
  display: flex;
  align-items: center;

  @media (max-width: ${mediaQueries.mobile}) {
    font-size: ${fontSize.xxs};
  }
`;

const ButtonText = styled.div`
  font-size: ${fontSize.sm};
  line-height: 20px;

  @media (max-width: ${mediaQueries.mobile}) {
    font-size: ${fontSize.xxs};
  }
`;

const StyledPlayIcon = styled(IoIosPlay)`
  color: black;
  cursor: pointer;
  font-size: 28px;
  margin-right: 8px;

  &:hover {
    color: ${primary};
  }
`;

const StyledPauseIcon = styled(IoIosPause)`
  color: black;
  cursor: pointer;
  font-size: 28px;
  margin-right: 8px;

  &:hover {
    color: ${primary};
  }
`;

const RATIO = 2.6666;

const getWidth = () => {
  const navWidth = 162;
  const margin = 64;
  const maxCanvasWidth = 800;
  const maxWidth = maxCanvasWidth + margin + navWidth;

  const removeNavWidth = window.innerWidth > 800 ? 162 : 0;

  if (window.innerWidth > maxWidth) return maxCanvasWidth;

  if (window.innerWidth < maxWidth)
    return window.innerWidth - 66 - removeNavWidth;
};

const calcBarHeight = (barHeight, height) => {
  const barHeightPercent = barHeight / 255;
  return Math.floor(barHeightPercent * height);
};

const Visualizer = () => {
  const [stateWidth, setWidth] = useState(getWidth());
  const [fileName, setFileName] = useState("");
  const [showIcon, setShowIcon] = useState(null);

  const width = useRef(getWidth());
  const audioCtx = useRef(new AudioContext());
  const analyser = useRef(audioCtx.current.createAnalyser());
  const canvas = useRef(null);
  const input = useRef(null);
  const canvasCtx = useRef();
  const dataArray = useRef();
  const source = useRef();

  useEffect(() => {
    canvasCtx.current = canvas.current.getContext("2d");

    const handleResize = () => {
      // this is only so the component
      // will rerender when the window is resized
      setWidth(getWidth());

      // need to store this as a ref so
      // draw will not have old state, pretty dumb!
      width.current = getWidth();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      audioCtx.current.close();
    };
  }, []);

  const handlePlayClick = () => {
    if (audioCtx.current.state === "suspended") {
      audioCtx.current.resume().then(function() {
        setShowIcon("pause");
      });
    }
  };

  const handlePauseClick = () => {
    if (audioCtx.current.state === "running") {
      audioCtx.current.suspend().then(function() {
        setShowIcon("play");
      });
    }
  };

  const handleFiles = () => {
    const reader = new FileReader();
    source.current = audioCtx.current.createBufferSource();

    if (input.current.files.length !== 1) {
      alert("You may only select a single file!");
      return;
    }

    if (input.current.files[0].type !== "audio/mp3") {
      alert("The file selected must be an mp3!");
      return;
    }

    setFileName(input.current.files[0].name);
    reader.readAsArrayBuffer(input.current.files[0]);

    reader.onloadend = e => {
      audioCtx.current.decodeAudioData(e.target.result).then(decodedData => {
        source.current.buffer = decodedData;
        source.current.connect(analyser.current);
        analyser.current.connect(audioCtx.current.destination);

        setUp();
      });
    };
  };

  const setUp = () => {
    // audio config
    analyser.current.minDecibels = -90;
    analyser.current.maxDecibels = -10;
    analyser.current.smoothingTimeConstant = 0.85;
    analyser.current.fftSize = 256;
    // 8-bit unsigned integers
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);

    //begin
    setShowIcon("pause");
    source.current.start(0);

    setInterval(() => {
      requestAnimationFrame(draw);
    }, 1000 / 40);
  };

  // use callback?
  const draw = () => {
    const WIDTH = width.current;
    const HEIGHT = width.current / RATIO;
    const bufferLength = analyser.current.frequencyBinCount;

    analyser.current.getByteFrequencyData(dataArray.current);
    canvasCtx.current.clearRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH - bufferLength) / bufferLength;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = calcBarHeight(dataArray.current[i], HEIGHT);

      canvasCtx.current.fillStyle = "rgb(255, 87, 51)";
      canvasCtx.current.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  };

  const showButton = () => {
    if (audioCtx.current.state === "running")
      return <StyledPauseIcon onClick={handlePauseClick} />;

    return <StyledPlayIcon onClick={handlePlayClick} />;
  };

  return (
    <Container>
      <canvas
        ref={canvas}
        height={stateWidth / RATIO}
        width={stateWidth}
        style={{ border: "1px solid black" }}
      />
      <VisualizerControls>
        <UploadAndTitle>
          <StyledLabel for="file-upload">
            <ButtonText>Select File</ButtonText>
          </StyledLabel>
          <StyledInput
            type="file"
            id="file-upload"
            onChange={handleFiles}
            ref={input}
          />
          <FileNameContainer>
            <FileName>{fileName}</FileName>
          </FileNameContainer>
        </UploadAndTitle>
        <div>{showIcon !== null && showButton()}</div>
      </VisualizerControls>
    </Container>
  );
};

export default Visualizer;
