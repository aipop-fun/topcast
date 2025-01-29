'use client'

import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, RefreshCcw, ExternalLink, Clock, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Cast, DuneResponse, DuneRawCast } from '@/types/dune';
import Image from 'next/image';

interface ImagePreviewProps {
  src: string;
  alt?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const img = new window.Image();
    img.src = src;

    img.onload = () => {
      setDimensions({
        width: img.width,
        height: img.height
      });
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
  }, [src]);

  if (error) {
    return null;
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 mt-2">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-gray-400 animate-pulse" />
        </div>
      )}
      <div className="relative w-full aspect-video">
        <Image
          src={src}
          alt={alt || 'Cast image'}
          className={`object-contain transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          quality={75}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
        <div>{dimensions.height} x {dimensions.width}</div>
      </div>
    </div>
  );
};

const CastContent: React.FC<{ text: string }> = ({ text }) => {
  // Extract image URLs from text
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi;
  const imageUrls = text.match(imageUrlRegex) || [];

  // Remove image URLs from text for markdown rendering
  const textWithoutImages = text.replace(imageUrlRegex, '').trim();

  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-gray-100 text-lg">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </a>
          ),
        }}
      >
        {textWithoutImages}
      </ReactMarkdown>
      {imageUrls.map((url, index) => (
        <ImagePreview key={`${url}-${index}`} src={url} />
      ))}
    </div>
  );
};

const TopcastCard: React.FC<{ cast: Cast }> = ({ cast }) => {
  const handleCastClick = () => {
    window.open(cast.url, '_blank', 'noopener,noreferrer');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      onClick={handleCastClick}
      className="bg-gray-900 rounded-lg p-6 mb-4 hover:bg-gray-800 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-purple-400 font-medium">@{cast.username}</span>
            <span className="text-gray-500 text-sm flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimestamp(cast.timestamp)}
            </span>
          </div>
          <div className="mb-4">
            <CastContent text={cast.text} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span className="text-gray-300">{cast.reactionCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="text-gray-300">{cast.replyCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  Ratio: {cast.reactionReplyRatio.toFixed(2)}
                </span>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Topcast: React.FC = () => {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTopCasts = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('https://api.dune.com/api/v1/query/4639793/results?limit=1000', {
        headers: {
          'X-Dune-API-Key': process.env.NEXT_PUBLIC_DUNE_API_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = (await response.json()) as DuneResponse<DuneRawCast>;
      const processedCasts = data.result.rows.map((row: DuneRawCast) => ({
        url: row.url,
        text: row.text,
        reactionCount: row.reaction_count,
        replyCount: row.reply_count,
        reactionReplyRatio: row.reaction_reply_ratio,
        username: row.username,
        timestamp: row.timestamp,
        hash: row.hash,
        fid: row.fid
      }));

      setCasts(processedCasts);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopCasts();
    const intervalId = setInterval(fetchTopCasts, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Topcast
            </h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchTopCasts()}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && casts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No casts found in the last 24 hours
          </div>
        )}

        {!loading && !error && casts.length > 0 && (
          <div className="space-y-4">
            {casts.map((cast) => (
              <TopcastCard key={cast.hash} cast={cast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Topcast;