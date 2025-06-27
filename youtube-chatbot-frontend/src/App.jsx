import { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ParticlesBackground from "./components/Particles";
// const API_BASE = "https://youtube-chatbot-lyyq.onrender.com";
const API_BASE = "http://localhost:8000";

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatHistory, setChatHistory] = useState([]);

  const youtube_parser = (url) => {
    const regExp =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const handleLoadComments = async () => {
    if (!videoId) {
      toast.warn("⚠️ Submit a video first!");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/getcomment`, {
        video_id: videoId,
      });
      setComments(response.data.comments || []);
      toast.success("✅ Comments loaded!");
    } catch (err) {
      toast.error(
        "❌ Failed to load comments: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVideo = async () => {
    const id = youtube_parser(videoUrl);
    if (!id) {
      toast.error("❌ Invalid YouTube URL");
      return;
    }
    if (id === videoId && submitted) {
      toast.info("ℹ️ This video has already been submitted.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/submit`, { video_id: id });
      setVideoId(id);
      setSubmitted(true);
      setAnswer("");
      setChatHistory([]);
      setComments([]); 
      toast.success(
        "✅ Video processed successfully. You can now ask questions."
      );
    } catch (err) {
      toast.error("❌ Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.warn("⚠️ Please enter a question.");
      return;
    }

    const userQuestion = question.trim();
    setQuestion("");

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/ask`, {
        video_id: videoId,
        question: userQuestion,
      });

      const newAnswer = res.data.answer;
      setAnswer(newAnswer);

      setChatHistory((prev) => [
        ...prev,
        { type: "question", content: userQuestion, timestamp: new Date() },
        { type: "answer", content: newAnswer, timestamp: new Date() },
      ]);
    } catch (err) {
      toast.error("❌ Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <ParticlesBackground/>
      <ToastContainer position="top-right" />

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎥 YouTube AI Chatbot
            </h1>
            <p className="text-gray-600 text-lg">
              Ask questions about any YouTube video and get intelligent answers
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 mb-6 border border-white/20">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="🔗 Paste YouTube video URL here..."
                  className="flex-1 border-2 border-gray-200 focus:border-blue-500 p-4 rounded-xl transition-all duration-200 text-lg"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={loading}
                />
                <button
                  onClick={handleSubmitVideo}
                  className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    loading && "opacity-50 cursor-not-allowed transform-none"
                  }`}
                  disabled={loading}
                >
                  {loading && !submitted
                    ? "🔄 Processing..."
                    : "✨ Process Video"}
                </button>
              </div>

              {videoId && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={getYouTubeThumbnail(videoId)}
                    alt="Video thumbnail"
                    className="w-24 h-18 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <p className="text-sm text-gray-600">Video ID: {videoId}</p>
                    <p className="text-green-600 font-medium">
                      ✅ Ready for questions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {submitted && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Section */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`flex-1 py-4 px-6 font-medium transition-colors ${
                        activeTab === "chat"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      💬 Chat
                    </button>
                    <button
                      onClick={() => setActiveTab("history")}
                      className={`flex-1 py-4 px-6 font-medium transition-colors ${
                        activeTab === "history"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      📚 History (
                      {chatHistory.filter((h) => h.type === "question").length})
                    </button>
                  </div>
                  <div className="p-6">
                    {activeTab === "chat" && (
                      <div className="space-y-4">
                        {/* Current Answer */}
                        {answer && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
                            <p className="font-semibold text-blue-800 mb-2">
                              🤖 AI Answer:
                            </p>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {answer}
                            </p>
                          </div>
                        )}

                        {/* Question Input */}
                        <div className="space-y-3">
                          <textarea
                            rows="4"
                            placeholder="💭 Ask me anything about this video... (Press Enter to send, Shift+Enter for new line)"
                            className="w-full border-2 border-gray-200 focus:border-blue-500 p-4 rounded-xl transition-all duration-200 resize-none text-lg"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                          />
                          <button
                            onClick={handleAsk}
                            className={`w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                              loading &&
                              "opacity-50 cursor-not-allowed transform-none"
                            }`}
                            disabled={loading}
                          >
                            {loading ? "🔄 Thinking..." : "🚀 Ask Question"}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === "history" && (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {chatHistory.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">
                            No chat history yet. Start by asking a question! 🤔
                          </p>
                        ) : (
                          chatHistory.map((item, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-xl ${
                                item.type === "question"
                                  ? "bg-blue-50 border-l-4 border-blue-500"
                                  : "bg-green-50 border-l-4 border-green-500"
                              }`}
                            >
                              <p className="font-semibold mb-2 text-sm text-gray-600">
                                {item.type === "question"
                                  ? "❓ Question"
                                  : "🤖 Answer"}{" "}
                                - {item.timestamp.toLocaleTimeString()}
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {item.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                    💬 Comments ({comments.length})
                    <button
                      onClick={handleLoadComments}
                      className="bg-blue-500 text-white text-sm px-3 py-1 rounded-lg shadow hover:bg-blue-600 transition"
                      disabled={loading}
                    >
                      🔄 Load
                    </button>
                  </h3>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No comments loaded yet.
                      </p>
                    ) : (
                      comments.map((comment, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <p className="text-sm text-gray-800 leading-relaxed">
                            <strong>{comment.author || "Anonymous"}:</strong>{" "}
                            {comment.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
