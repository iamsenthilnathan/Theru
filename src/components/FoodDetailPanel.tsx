import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ThumbsUp,
  Plus,
  Check,
  Send,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FoodSpot } from '../types/foodSpot';

interface FoodDetailPanelProps {
  spot: FoodSpot | null;
  activeTab: 'about' | 'community';
  onTabChange: (tab: 'about' | 'community') => void;
  onClose: () => void;
  onAgreeRecommendation: (spotId: string, recId: string) => void;
  onAddRecommendation: (spotId: string, dishName: string, description: string) => void;
  onAddComment: (spotId: string, text: string, authorName?: string) => void;
  onLikeComment: (spotId: string, commentId: string) => void;
  onAddReply: (spotId: string, commentId: string, text: string, authorName?: string) => void;
  communityNotice?: string | null;
  onDismissNotice?: () => void;
}

export const FoodDetailPanel: React.FC<FoodDetailPanelProps> = ({
  spot,
  activeTab,
  onTabChange,
  onClose,
  onAgreeRecommendation,
  onAddRecommendation,
  onAddComment,
  onLikeComment,
  onAddReply,
  communityNotice,
  onDismissNotice
}) => {
  // Suggest Dish modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');

  // Write Comment state (collapsible input)
  const [isWritingComment, setIsWritingComment] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');

  // Reply state: tracks which commentId currently has the reply box open
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyText, setReplyText] = useState('');

  // Storefront photos & carousel state
  const rawRealPhotos = (spot?.photos?.filter(p => !p.startsWith('data:image/svg+xml')) || []).slice(0, 3);
  const stylizedVisual = spot?.image || (spot?.photos?.find(p => p.startsWith('data:image/svg+xml')));

  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Reset carousel index and failed photos when spot changes
  useEffect(() => {
    setActivePhotoIndex(0);
    setFailedPhotos({});
  }, [spot?.id]);

  // Pre-validate photos in background to handle network/load errors smoothly
  useEffect(() => {
    if (!spot || rawRealPhotos.length === 0) return;
    rawRealPhotos.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onerror = () => {
        setFailedPhotos(prev => ({ ...prev, [url]: true }));
      };
    });
  }, [spot?.id, rawRealPhotos.join(',')]);

  const cardRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape key
  useEffect(() => {
    if (!spot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spot, onClose]);

  // Close drawer when clicking outside
  useEffect(() => {
    if (!spot) return;
    const handleOutsideClick = (e: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleOutsideClick);
    }, 20);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [spot, onClose]);

  if (!spot) return null;

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    onAddRecommendation(spot.id, newDishName.trim(), newDishDesc.trim());
    setNewDishName('');
    setNewDishDesc('');
    setShowSuggestModal(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(spot.id, commentText.trim(), commentAuthor.trim() || 'You');
    setCommentText('');
    setCommentAuthor('');
    setIsWritingComment(false);
  };

  const handleReplySubmit = (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(spot.id, commentId, replyText.trim(), replyAuthor.trim() || 'You');
    setReplyText('');
    setReplyAuthor('');
    setActiveReplyCommentId(null);
  };

  const handleImageError = (url: string) => {
    setFailedPhotos(prev => ({ ...prev, [url]: true }));
  };

  const validPhotos = rawRealPhotos.filter(p => !failedPhotos[p]);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex(prev => (prev === 0 ? validPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex(prev => (prev === validPhotos.length - 1 ? 0 : prev + 1));
  };

  const currentPhotoIndex = Math.min(activePhotoIndex, Math.max(0, validPhotos.length - 1));

  // Consistent Price Range Display Logic:
  // priceMin + priceMax -> "₹50 – ₹150"
  // priceMin only -> "From ₹50"
  // priceMax only -> "Up to ₹150"
  // priceMin === priceMax -> "₹150"
  // neither -> do not show a price value
  const hasMin = typeof spot.priceMin === 'number' && !isNaN(spot.priceMin);
  const hasMax = typeof spot.priceMax === 'number' && !isNaN(spot.priceMax);
  let priceDisplay: string | null = null;
  if (hasMin && hasMax) {
    priceDisplay = spot.priceMin === spot.priceMax ? `₹${spot.priceMin}` : `₹${spot.priceMin} – ₹${spot.priceMax}`;
  } else if (hasMin) {
    priceDisplay = `From ₹${spot.priceMin}`;
  } else if (hasMax) {
    priceDisplay = `Up to ₹${spot.priceMax}`;
  }

  return (
    <div className="food-detail-overlay" onClick={onClose}>
      <div
        ref={cardRef}
        className="food-detail-card"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Header: Contains ONLY display/local name & close button */}
        <div className="detail-header">
          <h2 className="stall-name">{spot.name}</h2>
        <button className="close-btn" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>

      {/* Primary Navigation Tabs: [ About ] [ Community ] */}
      <div className="detail-nav-tabs">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => onTabChange('about')}
        >
          About
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => onTabChange('community')}
        >
          <span>Community</span>
          <span className="tab-count-badge">
            {spot.recommendations.length + spot.communityComments.length}
          </span>
        </button>
      </div>

      {/* =========================================================
          TAB 1: ABOUT
          - Photo-Priority Visual Area:
            * 1 real photo -> single image
            * 2-3 real photos -> compact carousel
            * 0 real photos -> fallback to AI/stylized 3D setup visual
            * AI visual NEVER appears when real photo exists
          - What is this place?
          - What is special here?
          - Opening hours & Price
          ========================================================= */}
      {activeTab === 'about' && (
        <div className="tab-pane tab-about">
          {/* Case 1: Exactly 1 valid real photo -> Single image */}
          {validPhotos.length === 1 && (
            <div className="detail-visual-strip single-photo">
              <img
                src={validPhotos[0]}
                alt={`${spot.name} storefront`}
                className="storefront-hero-img"
                onError={() => handleImageError(validPhotos[0])}
              />
            </div>
          )}

          {/* Case 2: 2 or 3 valid real photos -> Compact Carousel */}
          {validPhotos.length >= 2 && (
            <div className="storefront-carousel-container" aria-label={`${spot.name} storefront photos`}>
              <div className="storefront-carousel-slide">
                <img
                  src={validPhotos[currentPhotoIndex]}
                  alt={`${spot.name} storefront photo ${currentPhotoIndex + 1} of ${validPhotos.length}`}
                  className="storefront-hero-img"
                  onError={() => handleImageError(validPhotos[currentPhotoIndex])}
                />
              </div>

              {/* Navigation arrows */}
              <button
                type="button"
                className="carousel-nav-btn prev"
                onClick={handlePrevPhoto}
                aria-label="Previous photo"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="carousel-nav-btn next"
                onClick={handleNextPhoto}
                aria-label="Next photo"
              >
                <ChevronRight size={16} />
              </button>

              {/* Dot indicators */}
              <div className="carousel-dots" role="tablist">
                {validPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`carousel-dot ${idx === currentPhotoIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(idx);
                    }}
                    aria-label={`Go to photo ${idx + 1}`}
                    aria-selected={idx === currentPhotoIndex}
                    role="tab"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Case 3: No valid real photos -> Fallback to AI/stylized setup visual */}
          {validPhotos.length === 0 && stylizedVisual && (
            <div className="detail-visual-strip">
              <img src={stylizedVisual} alt={spot.name} className="stall-thumbnail" />
            </div>
          )}

          {/* 2. What is this place? */}
          {spot.description && (
            <div className="about-section">
              <h4 className="about-heading">What is this place?</h4>
              <p className="about-text">{spot.description}</p>
            </div>
          )}

          {/* 3. What is special here? */}
          {spot.specialties && spot.specialties.length > 0 && (
            <div className="about-section">
              <h4 className="about-heading">What is special here?</h4>
              <div className="about-specialties-list">
                {spot.specialties.map((item, idx) => (
                  <span key={idx} className="about-specialty-item">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Opening hours & 5. Price */}
          <div className="about-meta-row">
            {spot.openingHours && (
              <div className="about-meta-block">
                <span className="about-meta-label">Opening hours</span>
                <span className="about-meta-value">{spot.openingHours}</span>
              </div>
            )}

            {priceDisplay && (
              <div className="about-meta-block">
                <span className="about-meta-label">Price</span>
                <span className="about-meta-value">{priceDisplay}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: COMMUNITY
          ========================================================= */}
      {activeTab === 'community' && (
        <div className="tab-pane tab-community">
          {/* Scrollable Content Area: Recommendations, Tips & Comments */}
          <div className="community-scrollable-content">
            {communityNotice && (
              <div className="community-welcome-notice">
                <div className="notice-icon-bubble">💡</div>
                <div className="notice-text-content">
                  <span className="notice-headline">Found existing place</span>
                  <span className="notice-subtext">{communityNotice}</span>
                </div>
                {onDismissNotice && (
                  <button className="notice-dismiss-btn" onClick={onDismissNotice} title="Dismiss notice">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* SECTION 1: MOST RECOMMENDED / WHAT SHOULD I TRY? */}
            <div className="community-section">
              <div className="section-title-row">
                <div className="section-title-group">
                  <h3 className="section-heading">What should I try here?</h3>
                  <span className="section-subtext">Community-recommended dishes</span>
                </div>
                <button
                  type="button"
                  className="suggest-dish-btn"
                  onClick={() => setShowSuggestModal(true)}
                >
                  <Plus size={13} /> Suggest Dish
                </button>
              </div>

              {/* List of Structured Recommendations */}
              <div className="structured-recs-list">
                {spot.recommendations.map(rec => (
                  <div key={rec.id} className="rec-card">
                    <div className="rec-card-main">
                      <div className="rec-dish-name">{rec.dishName}</div>
                      {rec.description && <p className="rec-desc">{rec.description}</p>}
                      <span className="rec-count-label">
                        <strong>{rec.recommendCount}</strong> {rec.recommendCount === 1 ? 'person recommends' : 'people recommend'}
                      </span>
                    </div>

                    <div className="rec-action-col">
                      <button
                        type="button"
                        className={`agree-btn ${rec.userAgreed ? 'agreed' : ''}`}
                        onClick={() => onAgreeRecommendation(spot.id, rec.id)}
                        title={rec.userAgreed ? 'Click to remove agreement' : 'Agree with this recommendation'}
                      >
                        {rec.userAgreed ? (
                          <>
                            <Check size={12} /> Agreed
                          </>
                        ) : (
                          <>
                            <ThumbsUp size={12} /> Agree
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: LOCAL TIPS / COMMENTS */}
            <div className="community-section">
              <h3 className="section-heading">Local Tips & Knowledge</h3>

              <div className="community-comments-list">
                {spot.communityComments.map(comment => (
                  <div key={comment.id} className="comment-thread">
                    <div className="comment-item">
                      <div
                        className="comment-avatar"
                        style={{ backgroundColor: comment.avatarColor }}
                      >
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-content">
                        <div className="comment-author-row">
                          <span className="comment-author">{comment.authorName}</span>
                          <span className="comment-time">{comment.timeAgo}</span>
                        </div>
                        <p className="comment-text">"{comment.text}"</p>
                        <div className="comment-actions">
                          <button
                            type="button"
                            className={`comment-like-btn ${comment.userLiked ? 'liked' : ''}`}
                            onClick={() => onLikeComment(spot.id, comment.id)}
                          >
                            <ThumbsUp size={11} />
                            <span>Like {comment.likes}</span>
                          </button>
                          <button
                            type="button"
                            className="comment-reply-btn"
                            onClick={() => {
                              if (activeReplyCommentId === comment.id) {
                                setActiveReplyCommentId(null);
                              } else {
                                setActiveReplyCommentId(comment.id);
                                setReplyText('');
                              }
                            }}
                          >
                            <MessageCircle size={11} />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nested Replies List */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-nested-list">
                        {comment.replies.map(rep => (
                          <div key={rep.id} className="reply-item">
                            <div
                              className="comment-avatar small"
                              style={{ backgroundColor: rep.avatarColor }}
                            >
                              {rep.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="comment-content">
                              <div className="comment-author-row">
                                <span className="comment-author">{rep.authorName}</span>
                                <span className="comment-time">{rep.timeAgo}</span>
                              </div>
                              <p className="comment-text">{rep.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Reply Input Box */}
                    {activeReplyCommentId === comment.id && (
                      <form
                        onSubmit={e => handleReplySubmit(comment.id, e)}
                        className="inline-reply-box animate-slide-up"
                      >
                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={replyAuthor}
                          onChange={e => setReplyAuthor(e.target.value)}
                          className="reply-name-input"
                        />
                        <div className="reply-row">
                          <input
                            type="text"
                            placeholder={`Reply to ${comment.authorName}...`}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            className="reply-text-input"
                            autoFocus
                            required
                          />
                          <button
                            type="button"
                            className="reply-cancel-btn"
                            onClick={() => setActiveReplyCommentId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="reply-post-btn"
                            disabled={!replyText.trim()}
                          >
                            Post
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: PINNED COMMENT COMPOSER (Always visible at bottom of Community panel) */}
          <div className="write-comment-wrapper pinned-composer">
            {!isWritingComment ? (
              <button
                type="button"
                className="write-comment-placeholder-btn"
                onClick={() => setIsWritingComment(true)}
              >
                <span>Write something about this place...</span>
              </button>
            ) : (
              <form onSubmit={handleCommentSubmit} className="write-comment-active-form animate-slide-up">
                <input
                  type="text"
                  placeholder="Your name (optional, defaults to 'You')"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  className="comment-name-input"
                />
                <textarea
                  placeholder="Share a tip, correction, or what you know about this spot..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="comment-textarea"
                  rows={2}
                  autoFocus
                  required
                />
                <div className="comment-form-actions">
                  <button
                    type="button"
                    className="form-btn cancel"
                    onClick={() => {
                      setIsWritingComment(false);
                      setCommentText('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="form-btn post"
                    disabled={!commentText.trim()}
                  >
                    <Send size={12} /> Post
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          SUGGEST DISH MODAL
          ========================================================= */}
      {showSuggestModal && (
        <div className="suggest-modal-backdrop" onClick={() => setShowSuggestModal(false)}>
          <div className="suggest-modal-card animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Recommend a Dish</h4>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSuggestModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-subtitle">
              What is worth eating at <strong>{spot.name}</strong>?
            </p>

            <form onSubmit={handleSuggestSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Dish name</label>
                <input
                  type="text"
                  placeholder="e.g. Nannari Soda, Bun Butter Jam"
                  value={newDishName}
                  onChange={e => setNewDishName(e.target.value)}
                  className="modal-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Why do you recommend it?</label>
                <input
                  type="text"
                  placeholder="e.g. Made fresh with homemade syrup"
                  value={newDishDesc}
                  onChange={e => setNewDishDesc(e.target.value)}
                  className="modal-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="form-btn cancel"
                  onClick={() => setShowSuggestModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn recommend"
                  disabled={!newDishName.trim()}
                >
                  Recommend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
