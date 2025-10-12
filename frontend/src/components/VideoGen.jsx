export default function VideoGen({ config }) {
  return (
    <div
      style={{
        width: "310px",
        height: "154px",
        backgroundColor: "#242424",
        border: "2px solid #55e7ef",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {config && (
        <video
          src={config}
          controls
          autoPlay
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover", 
          }}
        />
      )}
    </div>
  );
}