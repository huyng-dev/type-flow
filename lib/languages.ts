export interface LanguageConfig {
  name: string;
  code: string;
  direction: "ltr" | "rtl";
  hasSpecialChars: boolean;
  commonPunctuation: string[];
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  english: {
    name: "English",
    code: "en",
    direction: "ltr",
    hasSpecialChars: false,
    commonPunctuation: [".", ",", "!", "?", ";", ":", '"', "'"],
  },
  vietnamese: {
    name: "Tiếng Việt",
    code: "vi",
    direction: "ltr",
    hasSpecialChars: true,
    commonPunctuation: [".", ",", "!", "?", ";", ":", '"', "'", "…"],
  },
};

// Comprehensive English word lists
export const ENGLISH_WORDS = {
  easy: [
    // Most common 100 words
    "the",
    "of",
    "and",
    "a",
    "to",
    "in",
    "is",
    "you",
    "that",
    "it",
    "he",
    "was",
    "for",
    "on",
    "are",
    "as",
    "with",
    "his",
    "they",
    "i",
    "at",
    "be",
    "this",
    "have",
    "from",
    "or",
    "one",
    "had",
    "by",
    "word",
    "but",
    "not",
    "what",
    "all",
    "were",
    "we",
    "when",
    "your",
    "can",
    "said",
    "there",
    "each",
    "which",
    "she",
    "do",
    "how",
    "their",
    "if",
    "will",
    "up",
    "other",
    "about",
    "out",
    "many",
    "then",
    "them",
    "these",
    "so",
    "some",
    "her",
    "would",
    "make",
    "like",
    "into",
    "him",
    "has",
    "two",
    "more",
    "go",
    "no",
    "way",
    "could",
    "my",
    "than",
    "first",
    "water",
    "been",
    "call",
    "who",
    "its",
    "now",
    "find",
    "long",
    "down",
    "day",
    "did",
    "get",
    "come",
    "made",
    "may",
    "part",
    "over",
    "new",
    "sound",
    "take",
    "only",
    "little",
    "work",
    "know",
    "place",
  ],
  medium: [
    // Common 200-500 words
    "year",
    "back",
    "give",
    "most",
    "very",
    "after",
    "thing",
    "our",
    "just",
    "name",
    "good",
    "sentence",
    "man",
    "think",
    "say",
    "great",
    "where",
    "help",
    "through",
    "much",
    "before",
    "line",
    "right",
    "too",
    "mean",
    "old",
    "any",
    "same",
    "tell",
    "boy",
    "follow",
    "came",
    "want",
    "show",
    "also",
    "around",
    "form",
    "three",
    "small",
    "set",
    "put",
    "end",
    "why",
    "again",
    "turn",
    "here",
    "move",
    "because",
    "good",
    "our",
    "give",
    "most",
    "very",
    "after",
    "thing",
    "just",
    "name",
    "sentence",
    "man",
    "think",
    "say",
    "great",
    "where",
    "help",
    "through",
    "much",
    "before",
    "line",
    "right",
    "too",
    "means",
    "old",
    "any",
    "same",
    "tell",
    "boy",
    "follow",
    "came",
    "want",
    "show",
    "large",
    "must",
    "big",
    "even",
    "such",
    "because",
    "turn",
    "here",
    "why",
    "ask",
    "went",
    "men",
    "read",
    "need",
    "land",
    "different",
    "home",
    "us",
    "move",
    "try",
  ],
  hard: [
    // Advanced vocabulary and longer words
    "important",
    "children",
    "example",
    "thought",
    "look",
    "government",
    "night",
    "yet",
    "system",
    "better",
    "four",
    "told",
    "nothing",
    "eyes",
    "city",
    "between",
    "every",
    "never",
    "last",
    "let",
    "another",
    "while",
    "should",
    "below",
    "country",
    "plant",
    "school",
    "father",
    "keep",
    "tree",
    "based",
    "understand",
    "face",
    "watch",
    "far",
    "indian",
    "really",
    "almost",
    "let",
    "above",
    "girl",
    "sometimes",
    "mountain",
    "cut",
    "young",
    "talk",
    "soon",
    "list",
    "being",
    "leave",
    "family",
    "never",
    "started",
    "saw",
    "together",
    "talk",
    "important",
    "until",
    "children",
    "side",
    "feet",
    "car",
    "mile",
    "night",
    "walk",
    "white",
    "sea",
    "began",
    "grow",
    "took",
    "river",
    "four",
    "carry",
    "state",
    "once",
    "book",
    "hear",
    "stop",
    "without",
    "second",
    "later",
    "miss",
    "idea",
    "enough",
    "eat",
    "face",
    "watch",
    "far",
    "indian",
    "really",
    "almost",
    "let",
    "above",
    "girl",
    "sometimes",
    "mountain",
    "cut",
    "young",
    "talk",
    "soon",
  ],
};

// Comprehensive Vietnamese word lists
export const VIETNAMESE_WORDS = {
  easy: [
    // Most common Vietnamese words
    "và",
    "của",
    "có",
    "là",
    "một",
    "này",
    "được",
    "cho",
    "từ",
    "với",
    "họ",
    "tôi",
    "anh",
    "chúng",
    "em",
    "cô",
    "ông",
    "bà",
    "con",
    "người",
    "nhà",
    "nước",
    "việc",
    "làm",
    "đi",
    "về",
    "ra",
    "vào",
    "lên",
    "xuống",
    "tại",
    "trong",
    "ngoài",
    "trên",
    "dưới",
    "sau",
    "trước",
    "giữa",
    "bên",
    "cạnh",
    "gần",
    "xa",
    "cao",
    "thấp",
    "lớn",
    "nhỏ",
    "mới",
    "cũ",
    "tốt",
    "xấu",
    "đẹp",
    "xấu",
    "nhanh",
    "chậm",
    "nhiều",
    "ít",
    "đủ",
    "thiếu",
    "đầy",
    "rỗng",
    "sáng",
    "tối",
    "nóng",
    "lạnh",
    "ấm",
    "mát",
    "khô",
    "ướt",
    "sạch",
    "bẩn",
    "mở",
    "đóng",
    "bật",
    "tắt",
    "vào",
    "ra",
    "lên",
    "xuống",
    "qua",
    "lại",
    "đây",
    "đó",
    "kia",
    "nào",
    "gì",
    "ai",
    "đâu",
    "khi",
    "nào",
    "sao",
    "như",
    "thế",
    "vậy",
    "thì",
    "mà",
    "rồi",
    "đã",
    "sẽ",
    "đang",
    "vừa",
    "hóa", // not hoá
    "góa", // not goá
    "tóa", // not toá
    "lóa", // not loá
    "hòa", // correct
    "gòa", // correct
    "hỏa", // correct
    "hõa", // correct
    "họa", // correct
    "quá", // not quá on wrong vowel
    "khúa", // not khuá
    "thúa", // not thuá
    "chúa", // not chuá
    "buổi", // correct - tone on u in uo combination
    "cuối", // correct - tone on u in uo combination
    "tuổi", // correct - tone on u in uo combination
    "ruổi", // correct - tone on u in uo combination
  ],
  medium: [
    // Common phrases and compound words
    "chúng tôi",
    "chúng ta",
    "những người",
    "thành phố",
    "nông thôn",
    "trường học",
    "bệnh viện",
    "công ty",
    "cửa hàng",
    "nhà hàng",
    "khách sạn",
    "sân bay",
    "ga tàu",
    "bến xe",
    "công viên",
    "bảo tàng",
    "thư viện",
    "rạp chiếu phim",
    "siêu thị",
    "chợ",
    "ngân hàng",
    "bưu điện",
    "công an",
    "bệnh viện",
    "gia đình",
    "bạn bè",
    "đồng nghiệp",
    "hàng xóm",
    "thầy cô",
    "học sinh",
    "sinh viên",
    "công nhân",
    "nông dân",
    "bác sĩ",
    "y tá",
    "kỹ sư",
    "giáo viên",
    "luật sư",
    "kiến trúc sư",
    "họa sĩ",
    "nhạc sĩ",
    "ca sĩ",
    "diễn viên",
    "vận động viên",
    "đầu bếp",
    "tài xế",
    "phi công",
    "thuyền trưởng",
    "thời gian",
    "không gian",
    "cuộc sống",
    "xã hội",
    "kinh tế",
    "chính trị",
    "văn hóa",
    "giáo dục",
    "y tế",
    "môi trường",
    "công nghệ",
    "thông tin",
    "truyền thông",
    "giao thông",
    "du lịch",
    "thể thao",
    "âm nhạc",
    "hội họa",
    "văn học",
    "khoa học",
    "toán học",
    "vật lý",
    "hóa học",
    "sinh học",
    "lịch sử",
    "địa lý",
    "ngoại ngữ",
    "tin học",
    "thể dục",
    "mỹ thuật",
    "âm nhạc",
    "kỹ thuật",
    "hóa học", // not hoá học
    "tòa nhà", // not toá nhà
    "góa phụ", // not goá phụ
    "lóa mắt", // not loá mắt
    "hòa bình", // correct
    "hòa giải", // correct
    "hòa hợp", // correct
    "tòa án", // correct
    "tòa nhà", // correct
    "buổi sáng", // correct - tone on u
    "buổi chiều", // correct - tone on u
    "cuối tuần", // correct - tone on u
    "tuổi trẻ", // correct - tone on u
  ],
  hard: [
    // Complex phrases and technical terms
    "phát triển bền vững",
    "công nghệ thông tin",
    "trí tuệ nhân tạo",
    "kinh tế thị trường",
    "chính sách xã hội",
    "môi trường sống",
    "biến đổi khí hậu",
    "năng lượng tái tạo",
    "giáo dục đại học",
    "nghiên cứu khoa học",
    "y tế công cộng",
    "an ninh quốc gia",
    "hợp tác quốc tế",
    "toàn cầu hóa",
    "đa dạng sinh học",
    "phát triển kinh tế",
    "văn hóa truyền thống",
    "di sản văn hóa",
    "nghệ thuật dân gian",
    "lễ hội truyền thống",
    "ẩm thực Việt Nam",
    "du lịch sinh thái",
    "nông nghiệp hữu cơ",
    "công nghiệp chế biến",
    "dịch vụ tài chính",
    "thương mại điện tử",
    "khởi nghiệp sáng tạo",
    "đổi mới công nghệ",
    "quản lý chất lượng",
    "bảo vệ môi trường",
    "phát triển bền vững",
    "tài nguyên thiên nhiên",
    "đa dạng văn hóa",
    "hội nhập quốc tế",
    "cạnh tranh toàn cầu",
    "chuyển đổi số",
    "kinh tế số",
    "xã hội thông tin",
    "công dân số",
    "chính phủ điện tử",
    "quá trình hóa học", // not hoá học
    "tòa nhà chọc trời", // correct
    "buổi họp quan trọng", // correct - tone on u
    "cuối cùng thành công", // correct - tone on u
    "tuổi thọ con người", // correct - tone on u
    "hòa hợp dân tộc", // correct
    "hòa giải xung đột", // correct
    "góa bụa cô đơn", // not goá - tone on o
    "lóa mắt chói chang", // not loá - tone on o
  ],
};

// Common English phrases and sentences
export const ENGLISH_PHRASES = {
  easy: [
    "I am fine",
    "How are you",
    "Thank you",
    "You are welcome",
    "Good morning",
    "Good night",
    "See you later",
    "Have a nice day",
    "Take care",
    "Good luck",
  ],
  medium: [
    "The quick brown fox jumps over the lazy dog",
    "Practice makes perfect",
    "Time is money",
    "Knowledge is power",
    "Actions speak louder than words",
  ],
  hard: [
    "The development of technology has revolutionized the way we communicate",
    "Environmental protection is crucial for sustainable development",
    "Education plays a vital role in personal and social development",
    "International cooperation is essential for global peace and prosperity",
  ],
};

// Common Vietnamese phrases and sentences
export const VIETNAMESE_PHRASES = {
  easy: [
    "Xin chào",
    "Tạm biệt",
    "Cảm ơn bạn",
    "Không có gì",
    "Chúc ngủ ngon",
    "Chúc một ngày tốt lành",
    "Hẹn gặp lại",
    "Chúc may mắn",
    "Bạn khỏe không",
    "Tôi khỏe",
    "Hóa ra như vậy", // not Hoá ra
    "Tòa nhà này đẹp", // correct
    "Buổi sáng tốt lành", // correct - tone on u
    "Cuối tuần vui vẻ", // correct - tone on u
  ],
  medium: [
    "Việt Nam là một đất nước xinh đẹp",
    "Học tập là con đường dẫn đến thành công",
    "Gia đình là tổ ấm của mỗi người",
    "Bạn bè là những người đồng hành trong cuộc sống",
    "Sức khỏe là vàng, bệnh tật là điều đáng sợ nhất",
    "Hóa học là môn học thú vị", // not Hoá học
    "Tòa nhà cao tầng hiện đại", // correct
    "Buổi chiều nắng đẹp", // correct - tone on u
    "Cuối năm bận rộn", // correct - tone on u
    "Tuổi trẻ đầy nhiệt huyết", // correct - tone on u
  ],
  hard: [
    "Sự phát triển của công nghệ thông tin đã thay đổi cách chúng ta sống và làm việc",
    "Bảo vệ môi trường là trách nhiệm của mỗi công dân đối với thế hệ tương lai",
    "Giáo dục đóng vai trò quan trọng trong việc phát triển con người và xã hội",
    "Hợp tác quốc tế là chìa khóa để giải quyết các vấn đề toàn cầu",
    "Quá trình hóa học phức tạp đòi hỏi sự chính xác cao", // not hoá học
    "Tòa nhà chọc trời là biểu tượng của sự phát triển đô thị", // correct
    "Buổi họp quan trọng này sẽ quyết định tương lai công ty", // correct - tone on u
    "Cuối cùng chúng ta đã tìm ra giải pháp tối ưu", // correct - tone on u
    "Tuổi thọ trung bình của người Việt Nam đang tăng lên", // correct - tone on u
  ],
};

export type LanguageType = "english" | "vietnamese";
export type DifficultyType = "easy" | "medium" | "hard";
export type ContentType = "words" | "phrases";

export interface WordSelectionOptions {
  language: LanguageType;
  difficulty: DifficultyType;
  contentType: ContentType;
  count: number;
  avoidRepeats?: boolean;
}

export class LanguageManager {
  private recentWords: Set<string> = new Set();
  private maxRecentWords = 20;

  getWordList(language: LanguageType, difficulty: DifficultyType): string[] {
    if (language === "english") {
      return ENGLISH_WORDS[difficulty];
    } else {
      return VIETNAMESE_WORDS[difficulty];
    }
  }

  getPhraseList(language: LanguageType, difficulty: DifficultyType): string[] {
    if (language === "english") {
      return ENGLISH_PHRASES[difficulty];
    } else {
      return VIETNAMESE_PHRASES[difficulty];
    }
  }

  generateContent(options: WordSelectionOptions): string[] {
    const { language, difficulty, contentType, count, avoidRepeats = true } = options;

    if (contentType === "phrases") {
      const phrases = this.getPhraseList(language, difficulty);
      const shuffled = [...phrases].sort(() => Math.random() - 0.5);
      const resultWords: string[] = [];
      let phraseIdx = 0;

      while (resultWords.length < count && phraseIdx < shuffled.length * 3) {
        const phrase = shuffled[phraseIdx % shuffled.length];
        const tokens = phrase.trim().split(/\s+/).filter(Boolean);
        for (const token of tokens) {
          resultWords.push(token);
          if (resultWords.length >= count) break;
        }
        phraseIdx++;
      }
      return resultWords;
    }

    const sourceList = this.getWordList(language, difficulty);
    // Flatten any compound words into single word tokens
    const flattenedList: string[] = [];
    for (const item of sourceList) {
      const tokens = item.trim().split(/\s+/).filter(Boolean);
      flattenedList.push(...tokens);
    }

    const result: string[] = [];
    const availableItems = avoidRepeats ? flattenedList.filter((item) => !this.recentWords.has(item)) : flattenedList;
    const itemsToUse = availableItems.length >= count ? availableItems : flattenedList;

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * itemsToUse.length);
      const selectedItem = itemsToUse[randomIndex];
      result.push(selectedItem);

      if (avoidRepeats) {
        this.recentWords.add(selectedItem);
        // Keep recent words list manageable
        if (this.recentWords.size > this.maxRecentWords) {
          const firstItem = this.recentWords.values().next().value;
          if (typeof firstItem === "string") {
            this.recentWords.delete(firstItem);
          }
        }
      }
    }

    return result;
  }

  // Check if a character is a Vietnamese diacritic
  isVietnameseDiacritic(char: string): boolean {
    const vietnameseDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseDiacritics.test(char);
  }

  // Normalize Vietnamese text for comparison
  normalizeVietnamese(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Get language-specific typing hints
  getTypingHints(language: LanguageType): string[] {
    if (language === "vietnamese") {
      return [
        "Use Vietnamese input method for diacritics",
        "Focus on tone marks: à á ả ã ạ",
        "Practice common combinations: ng, nh, ch, tr",
        "Remember đ is different from d",
      ];
    } else {
      return [
        "Focus on common letter combinations",
        "Practice punctuation placement",
        "Work on capitalization patterns",
        "Build muscle memory for frequent words",
      ];
    }
  }

  // Get character frequency for the language
  getCharacterFrequency(language: LanguageType): Record<string, number> {
    if (language === "vietnamese") {
      return {
        a: 12.5,
        n: 9.8,
        i: 8.2,
        h: 7.1,
        o: 6.8,
        u: 6.2,
        g: 5.9,
        t: 5.7,
        r: 5.1,
        c: 4.8,
        đ: 4.2,
        ă: 3.8,
        ê: 3.5,
        ô: 3.2,
        ư: 2.9,
      };
    } else {
      return {
        e: 12.7,
        t: 9.1,
        a: 8.2,
        o: 7.5,
        i: 7.0,
        n: 6.7,
        s: 6.3,
        h: 6.1,
        r: 6.0,
        d: 4.3,
        l: 4.0,
        c: 2.8,
        u: 2.8,
        m: 2.4,
        w: 2.4,
      };
    }
  }

  // Vietnamese diacritic correction method
  correctVietnameseDiacritics(text: string): string {
    // Common Vietnamese diacritic corrections
    const corrections: Record<string, string> = {
      // oa combinations - tone should be on 'o'
      hoá: "hóa",
      goá: "góa",
      toá: "tóa",
      loá: "lóa",
      coá: "cóa",
      doá: "dóa",
      noá: "nóa",
      roá: "róa",
      soá: "sóa",
      voá: "vóa",
      xoá: "xóa",
      zoá: "zóa",

      // oe combinations - tone should be on 'o'
      hoé: "hóe",
      goé: "góe",
      toé: "tóe",
      loé: "lóe",

      // uy combinations - tone should be on 'u'
      quyá: "quýa", // though this is rare
      huyá: "huýa",

      // Common mistakes in compound words
      "hoá học": "hóa học",
      "toá nhà": "tòa nhà", // this should actually be tòa not tóa
      "goá phụ": "góa phụ",
      "loá mắt": "lóa mắt",
    };

    let correctedText = text;
    for (const [incorrect, correct] of Object.entries(corrections)) {
      correctedText = correctedText.replace(new RegExp(incorrect, "gi"), correct);
    }

    return correctedText;
  }

  validateVietnameseInput(
    input: string,
    target: string
  ): {
    isCorrect: boolean;
    correctedInput?: string;
    suggestion?: string;
  } {
    const correctedInput = this.correctVietnameseDiacritics(input);
    const correctedTarget = this.correctVietnameseDiacritics(target);

    if (correctedInput === correctedTarget) {
      return {
        isCorrect: true,
        correctedInput: input !== correctedInput ? correctedInput : undefined,
      };
    }

    // Check if it's just a diacritic placement issue
    if (this.normalizeVietnamese(input) === this.normalizeVietnamese(target)) {
      return {
        isCorrect: false,
        correctedInput,
        suggestion: `Dấu thanh đặt sai vị trí. Đúng là: "${correctedTarget}"`,
      };
    }

    return { isCorrect: false };
  }
}

export const languageManager = new LanguageManager();
