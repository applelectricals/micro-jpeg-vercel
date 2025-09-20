import { Router } from 'express';

const router = Router();

// API Documentation endpoint
router.get('/docs', (req, res) => {
  const docs = {
    title: "Micro JPEG API Documentation",
    version: "1.0.0",
    description: "Professional image compression API with advanced quality settings",
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    authentication: {
      type: "Bearer Token",
      description: "Include your API key in the Authorization header",
      example: "Authorization: Bearer sk_test_1234567890abcdef"
    },
    endpoints: {
      status: {
        method: "GET",
        path: "/status",
        description: "Check API health and get endpoint information",
        authentication: false,
        response: {
          status: "operational",
          version: "1.0.0",
          timestamp: "2025-08-27T05:58:37.922Z",
          endpoints: {
            compress: "/api/v1/compress",
            batch: "/api/v1/batch",
            "special-convert": "/api/v1/special/convert",
            "special-batch": "/api/v1/special/batch",
            "special-formats": "/api/v1/special/formats",
            "pricing": "/api/v1/pricing"
          }
        }
      },
      compress: {
        method: "POST",
        path: "/compress",
        description: "Compress a single image with advanced settings",
        authentication: true,
        permissions: ["compress"],
        parameters: {
          image: {
            type: "file",
            required: true,
            description: "Image file to compress (JPEG, PNG, WebP, AVIF)"
          },
          settings: {
            type: "json",
            required: false,
            description: "Compression settings object",
            properties: {
              quality: {
                type: "number",
                range: "10-100",
                default: 75,
                description: "Compression quality percentage"
              },
              outputFormat: {
                type: "string",
                enum: ["jpeg", "webp", "avif", "png"],
                default: "jpeg",
                description: "Output image format"
              },
              compressionAlgorithm: {
                type: "string",
                enum: ["standard", "aggressive", "lossless", "mozjpeg", "progressive"],
                default: "standard",
                description: "Compression algorithm to use"
              },
              resizeQuality: {
                type: "string",
                enum: ["lanczos", "bicubic", "bilinear", "nearest"],
                default: "lanczos",
                description: "Resize quality algorithm"
              },
              webOptimization: {
                type: "boolean",
                default: true,
                description: "Enable web optimization"
              },
              progressive: {
                type: "boolean",
                default: false,
                description: "Enable progressive JPEG encoding"
              }
            }
          }
        },
        response: {
          success: true,
          result: {
            id: "uuid",
            originalFilename: "image.jpg",
            originalSize: 125037,
            compressedSize: 92376,
            compressionRatio: 26,
            outputFormat: "jpeg",
            qualityUsed: 75,
            processingTime: 245,
            data: "base64_encoded_image_data"
          }
        }
      },
      batch: {
        method: "POST",
        path: "/batch",
        description: "Compress multiple images in batch",
        authentication: true,
        permissions: ["batch"],
        parameters: {
          images: {
            type: "file[]",
            required: true,
            description: "Array of image files to compress (max 10)"
          },
          settings: {
            type: "json",
            required: false,
            description: "Same compression settings as single compress endpoint"
          }
        },
        response: {
          success: true,
          results: ["array of compression results"],
          summary: {
            totalFiles: 2,
            successfulFiles: 2,
            failedFiles: 0,
            totalBytesProcessed: 250074,
            totalBytesReturned: 184752,
            totalCompressionRatio: 26,
            processingTime: 2045
          }
        }
      },
      usage: {
        method: "GET",
        path: "/usage",
        description: "Get API key usage statistics",
        authentication: true,
        response: {
          apiKey: {
            id: "uuid",
            name: "My API Key",
            permissions: ["compress", "convert"],
            rateLimit: 1000
          },
          usage: {
            currentHour: 45,
            remainingRequests: 955,
            resetTime: "2025-08-27T06:58:37.922Z"
          }
        }
      },
      specialFormats: {
        method: "GET",
        path: "/special/formats",
        description: "Get supported special formats and pricing information",
        authentication: true,
        permissions: ["special-convert"],
        response: {
          supportedFormats: {
            input: {
              raw: {
                formats: ["ARW", "CR2", "DNG", "NEF", "ORF", "RAF", "RW2"],
                description: "Camera RAW files from professional cameras",
                maxFileSize: "150MB",
                processingTime: "15-30 seconds"
              },
              vector: {
                formats: ["SVG"],
                description: "Scalable Vector Graphics",
                maxFileSize: "50MB",
                processingTime: "5-10 seconds"
              },
              formats: {
                formats: ["TIFF", "TIF"],
                description: "Tagged Image File Format",
                maxFileSize: "150MB",
                processingTime: "10-20 seconds"
              }
            },
            output: ["JPEG", "PNG", "WebP", "AVIF", "TIFF"],
            pricing: {
              perConversion: "$0.10",
              monthlyPlan: "$29.99/month for 500 conversions",
              enterprisePlan: "Custom pricing for 1000+ conversions/month"
            }
          }
        }
      },
      specialConvert: {
        method: "POST",
        path: "/special/convert",
        description: "Convert a single special format file (RAW, SVG, TIFF) to standard formats",
        authentication: true,
        permissions: ["special-convert"],
        parameters: {
          file: {
            type: "file",
            required: true,
            description: "Special format file to convert (RAW, SVG, TIFF)"
          },
          outputFormat: {
            type: "string",
            enum: ["jpeg", "png", "webp", "avif", "tiff"],
            default: "jpeg",
            description: "Output image format"
          },
          quality: {
            type: "number",
            range: "10-100",
            default: 85,
            description: "Output quality percentage"
          },
          resize: {
            type: "string",
            enum: ["true", "false"],
            default: "false",
            description: "Whether to resize the output image"
          },
          width: {
            type: "number",
            description: "Output width (when resize=true)"
          },
          height: {
            type: "number", 
            description: "Output height (when resize=true)"
          },
          maintainAspect: {
            type: "string",
            enum: ["true", "false"],
            default: "true",
            description: "Maintain aspect ratio when resizing"
          }
        },
        response: {
          success: true,
          result: {
            id: "uuid",
            originalFilename: "IMG_001.arw",
            originalSize: 36474880,
            convertedSize: 518486,
            compressionRatio: 98,
            inputFormat: "ARW",
            outputFormat: "JPEG",
            processingTime: 12836,
            data: "base64-encoded-converted-file"
          },
          usage: {
            apiKeyId: "api-key-id",
            bytesProcessed: 36474880,
            bytesReturned: 518486
          }
        }
      },
      specialBatch: {
        method: "POST",
        path: "/special/batch",
        description: "Convert multiple special format files in a single request",
        authentication: true,
        permissions: ["special-batch"],
        parameters: {
          files: {
            type: "file[]",
            required: true,
            description: "Array of special format files to convert (max 5 files)"
          },
          outputFormat: {
            type: "string",
            enum: ["jpeg", "png", "webp", "avif", "tiff"],
            default: "jpeg",
            description: "Output format for all files"
          },
          quality: {
            type: "number",
            range: "10-100", 
            default: 85,
            description: "Output quality for all files"
          }
        },
        response: {
          success: true,
          results: "Array of conversion results",
          summary: {
            totalFiles: 5,
            successfulFiles: 5,
            failedFiles: 0,
            totalBytesProcessed: 182374400,
            totalBytesReturned: 2592430,
            totalCompressionRatio: 98,
            processingTime: 64180
          }
        }
      }
    },
    errors: {
      "401": {
        description: "Authentication required or invalid API key",
        example: {
          error: "Invalid API key",
          message: "The provided API key is invalid, expired, or inactive"
        }
      },
      "403": {
        description: "Insufficient permissions",
        example: {
          error: "Insufficient permissions",
          message: "Your API key does not have the required permission: batch"
        }
      },
      "429": {
        description: "Rate limit exceeded",
        example: {
          error: "Rate limit exceeded",
          message: "You have exceeded your rate limit of 1000 requests per hour"
        }
      },
      "400": {
        description: "Bad request - invalid input",
        example: {
          error: "Invalid settings",
          message: "Compression settings validation failed"
        }
      }
    },
    examples: {
      curl_compress: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/compress \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F 'settings={"quality":80,"outputFormat":"webp","compressionAlgorithm":"aggressive"}'`,
      
      curl_batch: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/batch \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "images=@photo1.jpg" \\
  -F "images=@photo2.png" \\
  -F 'settings={"quality":75,"outputFormat":"avif"}'`,
      
      curl_special_convert: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/special/convert \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@IMG_001.arw" \\
  -F "outputFormat=jpeg" \\
  -F "quality=85" \\
  -F "resize=true" \\
  -F "width=2560" \\
  -F "height=2560"`,
      
      curl_special_batch: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/special/batch \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "files=@photo1.arw" \\
  -F "files=@photo2.nef" \\
  -F "files=@vector.svg" \\
  -F "outputFormat=png" \\
  -F "quality=90"`,
      
      javascript: `// Using fetch API
const formData = new FormData();
formData.append('image', imageFile);
formData.append('settings', JSON.stringify({
  quality: 80,
  outputFormat: 'webp',
  compressionAlgorithm: 'aggressive'
}));

const response = await fetch('/api/v1/compress', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();`,
      
      javascript_special: `// Convert a RAW file to JPEG
const formData = new FormData();
formData.append('file', rawFile); // File input from <input type="file">
formData.append('outputFormat', 'jpeg');
formData.append('quality', '85');
formData.append('resize', 'true');
formData.append('width', '2560');
formData.append('height', '2560');

const response = await fetch('/api/v1/special/convert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();

// Convert the base64 data back to a file
const convertedFile = new Blob([
  Uint8Array.from(atob(result.result.data), c => c.charCodeAt(0))
], { type: 'image/jpeg' });`
    }
  };

  res.json(docs);
});

export { router as apiDocsRouter };