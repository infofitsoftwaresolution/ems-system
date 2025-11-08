import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, X, FileImage } from "lucide-react";

export function KycModal({ isOpen, onClose, onKycComplete, user }) {
  const [kycData, setKycData] = useState({
    panNumber: "",
    aadharNumber: "",
    address: "",
    phoneNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    dob: "",
    documentType: "aadhaar",
  });
  const [panCardFile, setPanCardFile] = useState(null);
  const [aadharCardFile, setAadharCardFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!kycData.panNumber || !kycData.aadharNumber || !kycData.address || !kycData.dob) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!panCardFile || !aadharCardFile) {
      toast.error("Please upload both PAN card and Aadhar card photos");
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('panNumber', kycData.panNumber);
      formData.append('aadharNumber', kycData.aadharNumber);
      formData.append('address', kycData.address);
      formData.append('phoneNumber', kycData.phoneNumber);
      formData.append('emergencyContact', kycData.emergencyContact);
      formData.append('emergencyPhone', kycData.emergencyPhone);
      formData.append('panCard', panCardFile);
      formData.append('aadharCard', aadharCardFile);
      
      // Add required fields for backend
      formData.append('dob', kycData.dob);
      formData.append('documentType', kycData.documentType);
      formData.append('documentNumber', kycData.aadharNumber); // Use Aadhar as primary document
      
      // Add required user information
      if (user) {
        formData.append('fullName', user.name || '');
        formData.append('employeeId', user.id || '');
        formData.append('email', user.email || '');
      }

      // Submit KYC data
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
      const response = await fetch(`${apiUrl}/kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit KYC');
      }

      await onKycComplete(kycData);
      toast.success("KYC information submitted successfully!");
            setKycData({
              panNumber: "",
              aadharNumber: "",
              address: "",
              phoneNumber: "",
              emergencyContact: "",
              emergencyPhone: "",
              dob: "",
              documentType: "aadhaar",
            });
      onClose();
    } catch (error) {
      console.error('KYC submission error:', error);
      toast.error("Failed to submit KYC information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Your KYC</DialogTitle>
          <DialogDescription>
            Please provide your KYC information to complete your profile setup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number *</Label>
              <Input
                id="panNumber"
                placeholder="Enter PAN number"
                value={kycData.panNumber}
                onChange={(e) => setKycData({...kycData, panNumber: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadharNumber">Aadhar Number *</Label>
              <Input
                id="aadharNumber"
                placeholder="Enter Aadhar number"
                value={kycData.aadharNumber}
                onChange={(e) => setKycData({...kycData, aadharNumber: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={kycData.dob}
              onChange={(e) => setKycData({...kycData, dob: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              placeholder="Enter your complete address"
              value={kycData.address}
              onChange={(e) => setKycData({...kycData, address: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="Enter phone number"
                value={kycData.phoneNumber}
                onChange={(e) => setKycData({...kycData, phoneNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                placeholder="Emergency contact name"
                value={kycData.emergencyContact}
                onChange={(e) => setKycData({...kycData, emergencyContact: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyPhone"
              placeholder="Emergency contact phone number"
              value={kycData.emergencyPhone}
              onChange={(e) => setKycData({...kycData, emergencyPhone: e.target.value})}
            />
          </div>
          
          {/* File Upload Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Document Upload</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panCard">PAN Card Photo *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {panCardFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileImage className="h-4 w-4" />
                        <span className="text-sm">{panCardFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPanCardFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload PAN card photo</p>
                      <Input
                        id="panCard"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPanCardFile(e.target.files[0])}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('panCard').click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aadharCard">Aadhar Card Photo *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {aadharCardFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileImage className="h-4 w-4" />
                        <span className="text-sm">{aadharCardFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAadharCardFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload Aadhar card photo</p>
                      <Input
                        id="aadharCard"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAadharCardFile(e.target.files[0])}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('aadharCard').click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit KYC"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
