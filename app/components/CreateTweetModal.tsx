import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

interface CreateTweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TweetResponse {
  success: boolean;
  tweet?: {
    id: string;
    text: string;
  };
  error?: string;
}

const CreateTweetModal: React.FC<CreateTweetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tweetText, setTweetText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_CHARS = 280;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tweetText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting to post tweet...");
      const response = await axios.post<TweetResponse>(
        "http://localhost:5001/api/tweet",
        { text: tweetText },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response received:", response.data);

      if (response.data.success) {
        onSuccess();
        onClose();
        setTweetText("");
      } else {
        setError(response.data.error || "Failed to post tweet");
      }
    } catch (err) {
      console.error("Error posting tweet:", err);
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = err.response as {
          data?: { error?: string; details?: string };
        };
        const errorMessage =
          errorResponse.data?.error ||
          errorResponse.data?.details ||
          "Failed to post tweet. Please try again.";
        setError(errorMessage);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-green/50 p-0 rounded-[9px] w-[600px] h-[400px]"
      onCancel={onClose}
    >
      <div className="bg-green p-8 h-full flex flex-col w-full rounded-[9px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Tweet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow w-full"
        >
          <textarea
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder="What's happening?"
            className="w-full flex-grow p-4 border rounded-[9px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            maxLength={MAX_CHARS}
          />

          <div className="flex justify-between items-center mt-6">
            <span
              className={`text-sm ${
                tweetText.length > MAX_CHARS ? "text-red-500" : "text-gray-500"
              }`}
            >
              {tweetText.length}/{MAX_CHARS}
            </span>
            <button
              type="submit"
              disabled={
                isLoading || !tweetText.trim() || tweetText.length > MAX_CHARS
              }
              className="bg-blue-500 text-white px-8 py-3 rounded-[9px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors text-lg"
            >
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-[9px]">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>
    </dialog>
  );
};

export default CreateTweetModal;
